package NexVault.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * JPA entity representing a top-level product category in HashVault.
 *
 * <p>Categories are used to group digital products (e.g. Gift Cards, Streaming,
 * VPN &amp; Software).  Only categories with {@code isActive = true} are surfaced
 * through the public API.</p>
 *
 * <p>Maps to the {@code categories} table created by {@code V2__create_categories.sql}.</p>
 */
@Entity
@Table(name = "categories")
@Getter
@Setter
@NoArgsConstructor
public class Category {

    /** Surrogate primary key, generated as a UUID v4 by the database. */
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    /** Human-readable display name shown on the storefront (e.g. "Gift Cards"). */
    @Column(name = "name", nullable = false, length = 100)
    private String name;

    /**
     * URL-safe identifier used in API paths and frontend routes
     * (e.g. {@code gift-cards}).  Must be globally unique.
     */
    @Column(name = "slug", nullable = false, unique = true, length = 100)
    private String slug;

    /** Optional longer description of what the category contains. */
    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    /** Unicode emoji displayed next to the category name on the UI (e.g. {@code 🎁}). */
    @Column(name = "emoji", length = 10)
    private String emoji;

    /**
     * Display sort order.  Categories are rendered in ascending order of this value
     * on the storefront.
     */
    @Column(name = "sort_order", nullable = false)
    private Integer sortOrder = 0;

    /**
     * Whether this category is visible to shoppers.
     * Set to {@code false} to hide the category without deleting it.
     */
    @Column(name = "is_active", nullable = false)
    private Boolean isActive = Boolean.TRUE;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_id")
    private Category parent;

    @OneToMany(mappedBy = "parent", fetch = FetchType.LAZY)
    private List<Category> children = new ArrayList<>();
}
