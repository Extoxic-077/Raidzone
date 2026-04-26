package NexVault.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;

/**
 * Forwards chat messages to a Discord channel via Webhook.
 * Also verifies the shared secret used by the Discord bot when posting replies back.
 */
@Slf4j
@Service
public class DiscordService {

    @Value("${app.discord.webhook-url:}")
    private String webhookUrl;

    @Value("${app.discord.bot-secret:}")
    private String botSecret;

    private final HttpClient http = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(5))
            .build();

    /**
     * Sends a message embed to the configured Discord channel.
     *
     * @param threadId   UUID of the chat thread (used as Discord thread label)
     * @param senderName Display name of the user
     * @param content    Message text
     */
    public void forwardToDiscord(String threadId, String senderName, String content) {
        if (webhookUrl == null || webhookUrl.isBlank()) return;

        // Discord Embed JSON
        String body = """
                {
                  "username": "RAIDZONE Support",
                  "embeds": [{
                    "color": 7864559,
                    "author": { "name": "%s" },
                    "description": "%s",
                    "footer": { "text": "Thread ID: %s" }
                  }]
                }
                """.formatted(
                        escape(senderName),
                        escape(content),
                        threadId
                );

        try {
            HttpRequest req = HttpRequest.newBuilder()
                    .uri(URI.create(webhookUrl))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(body))
                    .timeout(Duration.ofSeconds(5))
                    .build();
            http.sendAsync(req, HttpResponse.BodyHandlers.discarding())
                    .exceptionally(e -> { log.warn("[Discord] Webhook call failed: {}", e.getMessage()); return null; });
        } catch (Exception e) {
            log.warn("[Discord] Failed to send webhook: {}", e.getMessage());
        }
    }

    /**
     * Returns true if the provided secret matches the configured bot secret.
     */
    public boolean isValidBotSecret(String secret) {
        return botSecret != null && !botSecret.isBlank() && botSecret.equals(secret);
    }

    private String escape(String s) {
        if (s == null) return "";
        return s.replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\n", "\\n")
                .replace("\r", "");
    }
}
