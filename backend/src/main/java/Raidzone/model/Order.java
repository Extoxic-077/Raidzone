package Raidzone.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "orders")
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
@NoArgsConstructor
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "status", nullable = false, length = 20)
    private String status = "PENDING_PAYMENT";

    @Column(name = "total_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal totalAmount;

    @Column(name = "total_items", nullable = false)
    private int totalItems;

    @Column(name = "shipping_name", nullable = false, length = 120)
    private String shippingName;

    @Column(name = "shipping_email", nullable = false, length = 200)
    private String shippingEmail;

    @Column(name = "shipping_phone", length = 30)
    private String shippingPhone;

    @Column(name = "shipping_address", columnDefinition = "TEXT")
    private String shippingAddress;

    // ── Phase 9: payment tracking ─────────────────────────────────────────────

    @Column(name = "payment_method", length = 20)
    private String paymentMethod;

    @Column(name = "paid_at")
    private LocalDateTime paidAt;

    @Column(name = "discount_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal discountAmount = BigDecimal.ZERO;

    @Column(name = "coupon_code", length = 50)
    private String couponCode;

    // ─────────────────────────────────────────────────────────────────────────

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<OrderItem> items = new ArrayList<>();

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
