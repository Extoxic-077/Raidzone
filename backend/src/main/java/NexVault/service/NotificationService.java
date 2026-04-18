package NexVault.service;

import NexVault.dto.response.NotificationResponse;
import NexVault.model.Notification;
import NexVault.model.Order;
import NexVault.model.Payment;
import NexVault.model.User;
import NexVault.model.UserSession;
import NexVault.repository.NotificationRepository;
import NexVault.repository.UserRepository;
import NexVault.repository.UserSessionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserSessionRepository  userSessionRepository;
    private final UserRepository         userRepository;

    @Transactional
    public Notification createNotification(UUID userId, String type, String title,
                                           String message, String metadataJson) {
        User userRef = userRepository.getReferenceById(userId);

        Notification n = new Notification();
        n.setUser(userRef);
        n.setType(type);
        n.setTitle(title);
        n.setMessage(message);
        n.setMetadata(metadataJson);
        return notificationRepository.save(n);
    }

    @Transactional
    public void notifyLoginNewDevice(User user, String ipAddress, String userAgentRaw) {
        String ua         = userAgentRaw != null ? userAgentRaw : "";
        String deviceInfo = resolveDevice(ua);

        // Truncate user agent for storage
        String uaStored = ua.length() > 500 ? ua.substring(0, 500) : ua;

        boolean isNew = userSessionRepository
                .findByUserIdAndIpAddressAndUserAgent(user.getId(), ipAddress, uaStored)
                .map(session -> {
                    session.setLastSeenAt(LocalDateTime.now());
                    userSessionRepository.save(session);
                    return false;
                })
                .orElseGet(() -> {
                    UserSession s = new UserSession();
                    s.setUser(user);
                    s.setIpAddress(ipAddress);
                    s.setUserAgent(uaStored);
                    s.setDeviceInfo(deviceInfo);
                    userSessionRepository.save(s);
                    return true;
                });

        if (isNew) {
            String meta = String.format(
                    "{\"ip\":\"%s\",\"device\":\"%s\",\"time\":\"%s\"}",
                    ipAddress, deviceInfo.replace("\"", "'"), LocalDateTime.now());
            createNotification(user.getId(), "LOGIN_NEW_DEVICE",
                    "New login detected",
                    "Login from " + deviceInfo + " at IP " + ipAddress +
                    ". If this wasn't you, secure your account.",
                    meta);
            log.info("New device login notification sent to user {}", user.getEmail());
        }
    }

    @Transactional
    public void notifyOrderConfirmed(User user, Order order) {
        String shortId = order.getId().toString().substring(0, 8).toUpperCase();
        String meta    = String.format("{\"orderId\":\"%s\"}", order.getId());
        createNotification(user.getId(), "ORDER_CONFIRMED",
                "Order confirmed!",
                "Your order #" + shortId + " for ₹" +
                order.getTotalAmount().toBigInteger() + " has been confirmed.",
                meta);
    }

    @Transactional
    public void notifyPaymentSuccess(User user, Payment payment) {
        String provider = payment.getProvider() != null ? payment.getProvider().name() : "payment";
        BigDecimal amt  = payment.getAmount() != null ? payment.getAmount() : BigDecimal.ZERO;
        String meta     = String.format("{\"provider\":\"%s\",\"amount\":\"%s\"}", provider, amt);
        createNotification(user.getId(), "PAYMENT_SUCCESS",
                "Payment successful",
                "Payment of ₹" + amt.toBigInteger() + " via " + provider + " was successful.",
                meta);
    }

    @Transactional
    public void notifyWelcome(User user) {
        createNotification(user.getId(), "WELCOME",
                "Welcome to NexVault!",
                "Your account is ready. Start exploring digital goods.",
                null);
    }

    @Transactional(readOnly = true)
    public long getUnreadCount(UUID userId) {
        return notificationRepository.countByUserIdAndReadFalse(userId);
    }

    @Transactional(readOnly = true)
    public List<NotificationResponse> getNotifications(UUID userId) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .limit(50)
                .map(NotificationResponse::from)
                .toList();
    }

    @Transactional
    public void markAllAsRead(UUID userId) {
        notificationRepository.markAllAsRead(userId);
    }

    @Transactional
    public void markAsRead(UUID notificationId, UUID userId) {
        notificationRepository.findByIdAndUserId(notificationId, userId)
                .ifPresent(n -> {
                    n.setRead(true);
                    notificationRepository.save(n);
                });
    }

    private String resolveDevice(String ua) {
        if (ua.contains("Mobile") || ua.contains("Android") || ua.contains("iPhone")) return "Mobile device";
        if (ua.contains("Chrome"))  return "Chrome browser";
        if (ua.contains("Firefox")) return "Firefox browser";
        if (ua.contains("Safari"))  return "Safari browser";
        if (ua.contains("Edge"))    return "Edge browser";
        return "Unknown device";
    }
}
