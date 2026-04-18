package NexVault;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;
import org.springframework.scheduling.annotation.EnableAsync;

/**
 * Entry point for the HashVault backend Spring Boot application.
 *
 * <p>{@code @EnableJpaAuditing} activates Spring Data's auditing infrastructure
 * so that {@code @CreatedDate} and {@code @LastModifiedDate} fields on
 * {@link NexVault.model.Product} and {@link NexVault.model.User} are
 * populated automatically on every insert and update.</p>
 */
@SpringBootApplication
@EnableJpaAuditing
@EnableAsync
public class BackendApplication {

	/**
	 * Application entry point.
	 *
	 * @param args command-line arguments passed to the Spring context
	 */
	public static void main(String[] args) {
		SpringApplication.run(BackendApplication.class, args);
	}
}
