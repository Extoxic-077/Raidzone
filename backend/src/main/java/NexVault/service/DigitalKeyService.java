package NexVault.service;

import NexVault.model.DigitalKey;
import NexVault.model.OrderItem;
import NexVault.model.Product;
import NexVault.repository.DigitalKeyRepository;
import NexVault.repository.OrderItemRepository;
import NexVault.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.crypto.Cipher;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class DigitalKeyService {

    private static final String ALGORITHM = "AES/GCM/NoPadding";
    private static final int    GCM_IV_LENGTH  = 12;
    private static final int    GCM_TAG_LENGTH = 128;

    private final DigitalKeyRepository digitalKeyRepository;
    private final ProductRepository    productRepository;
    private final OrderItemRepository  orderItemRepository;

    @Value("${app.encryption.key:NexVaultDefaultKey123456789012345}")
    private String encryptionKeyStr;

    // ── Bulk add keys ─────────────────────────────────────────────────────────

    @Transactional
    public int addKeys(UUID productId, List<String> rawKeys) {
        Product product = productRepository.getReferenceById(productId);
        int added = 0;
        for (String raw : rawKeys) {
            String trimmed = raw.trim();
            if (trimmed.isEmpty()) continue;
            DigitalKey key = new DigitalKey();
            key.setProduct(product);
            key.setKeyValue(encrypt(trimmed));
            digitalKeyRepository.save(key);
            added++;
        }
        log.info("Added {} keys for product {}", added, productId);
        return added;
    }

    // ── Assign key on purchase ────────────────────────────────────────────────

    @Transactional
    public String assignKey(UUID orderItemId, UUID productId) {
        List<DigitalKey> available = digitalKeyRepository.findAvailableByProductId(productId);
        if (available.isEmpty()) {
            log.warn("No available keys for product {}", productId);
            return null;
        }
        DigitalKey key = available.get(0);
        OrderItem oi   = orderItemRepository.getReferenceById(orderItemId);
        key.setStatus("SOLD");
        key.setOrderItem(oi);
        key.setAssignedAt(LocalDateTime.now());
        digitalKeyRepository.save(key);

        oi.setDigitalKeyId(key.getId());
        orderItemRepository.save(oi);

        log.info("Assigned key {} to order item {}", key.getId(), orderItemId);
        return decrypt(key.getKeyValue());
    }

    // ── Query ─────────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public long countAvailable(UUID productId) {
        return digitalKeyRepository.countByProductIdAndStatus(productId, "AVAILABLE");
    }

    @Transactional(readOnly = true)
    public List<UserKeyView> getKeysForUser(UUID userId) {
        return digitalKeyRepository.findSoldKeysByUserId(userId).stream()
                .map(k -> new UserKeyView(
                        k.getId(),
                        k.getProduct().getId(),
                        k.getProduct().getName(),
                        k.getProduct().getEmoji(),
                        k.getProduct().getImageUrl(),
                        decrypt(k.getKeyValue()),
                        k.getAssignedAt()
                )).toList();
    }

    @Transactional(readOnly = true)
    public List<AdminKeyView> getKeysForProduct(UUID productId) {
        return digitalKeyRepository.findByProductIdOrderByAddedAtDesc(productId).stream()
                .map(k -> new AdminKeyView(
                        k.getId(),
                        k.getStatus(),
                        k.getOrderItem() != null ? k.getOrderItem().getId() : null,
                        k.getAssignedAt(),
                        k.getAddedAt()
                )).toList();
    }

    // ── DTOs ──────────────────────────────────────────────────────────────────

    public record UserKeyView(
            UUID id, UUID productId, String productName, String emoji,
            String imageUrl, String keyValue, LocalDateTime assignedAt) {}

    public record AdminKeyView(
            UUID id, String status, UUID orderItemId,
            LocalDateTime assignedAt, LocalDateTime addedAt) {}

    // ── Encryption helpers ────────────────────────────────────────────────────

    private byte[] secretKey() {
        byte[] keyBytes = encryptionKeyStr.getBytes(StandardCharsets.UTF_8);
        byte[] key32 = new byte[32];
        System.arraycopy(keyBytes, 0, key32, 0, Math.min(keyBytes.length, 32));
        return key32;
    }

    private String encrypt(String plaintext) {
        try {
            byte[] iv = new byte[GCM_IV_LENGTH];
            new SecureRandom().nextBytes(iv);
            Cipher cipher = Cipher.getInstance(ALGORITHM);
            cipher.init(Cipher.ENCRYPT_MODE,
                    new SecretKeySpec(secretKey(), "AES"),
                    new GCMParameterSpec(GCM_TAG_LENGTH, iv));
            byte[] ciphertext = cipher.doFinal(plaintext.getBytes(StandardCharsets.UTF_8));
            byte[] combined = new byte[GCM_IV_LENGTH + ciphertext.length];
            System.arraycopy(iv, 0, combined, 0, GCM_IV_LENGTH);
            System.arraycopy(ciphertext, 0, combined, GCM_IV_LENGTH, ciphertext.length);
            return Base64.getEncoder().encodeToString(combined);
        } catch (Exception e) {
            throw new RuntimeException("Encryption failed", e);
        }
    }

    private String decrypt(String encoded) {
        try {
            byte[] combined = Base64.getDecoder().decode(encoded);
            byte[] iv = new byte[GCM_IV_LENGTH];
            System.arraycopy(combined, 0, iv, 0, GCM_IV_LENGTH);
            byte[] ciphertext = new byte[combined.length - GCM_IV_LENGTH];
            System.arraycopy(combined, GCM_IV_LENGTH, ciphertext, 0, ciphertext.length);
            Cipher cipher = Cipher.getInstance(ALGORITHM);
            cipher.init(Cipher.DECRYPT_MODE,
                    new SecretKeySpec(secretKey(), "AES"),
                    new GCMParameterSpec(GCM_TAG_LENGTH, iv));
            return new String(cipher.doFinal(ciphertext), StandardCharsets.UTF_8);
        } catch (Exception e) {
            throw new RuntimeException("Decryption failed", e);
        }
    }
}
