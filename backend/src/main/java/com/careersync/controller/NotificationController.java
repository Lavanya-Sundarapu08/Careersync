package com.careersync.controller;

import com.careersync.common.ApiException;
import com.careersync.common.ApiResponse;
import com.careersync.domain.notification.Notification;
import com.careersync.dto.ApplicationDtos.NotificationResponse;
import com.careersync.repository.NotificationRepository;
import com.careersync.security.CustomUserDetails;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationRepository notificationRepository;

    @GetMapping
    public ApiResponse<List<NotificationResponse>> myNotifications(@AuthenticationPrincipal CustomUserDetails principal) {
        List<NotificationResponse> list = notificationRepository.findByUserIdOrderByCreatedAtDesc(principal.getId())
                .stream()
                .map(n -> new NotificationResponse(n.getId(), n.getTitle(), n.getBody(), n.isRead(), n.getCreatedAt()))
                .toList();
        return ApiResponse.ok(list);
    }

    @GetMapping("/unread-count")
    public ApiResponse<Map<String, Long>> unreadCount(@AuthenticationPrincipal CustomUserDetails principal) {
        long count = notificationRepository.countByUserIdAndReadFalse(principal.getId());
        return ApiResponse.ok(Map.of("unreadCount", count));
    }

    @PatchMapping("/{id}/read")
    @Transactional
    public ApiResponse<Void> markAsRead(@PathVariable UUID id, @AuthenticationPrincipal CustomUserDetails principal) {
        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Notification not found"));
        if (!notification.getUser().getId().equals(principal.getId())) {
            throw ApiException.forbidden("Not authorized to modify this notification");
        }
        notification.setRead(true);
        notificationRepository.save(notification);
        return ApiResponse.ok(null, "Marked as read");
    }

    @PatchMapping("/read-all")
    @Transactional
    public ApiResponse<Void> markAllAsRead(@AuthenticationPrincipal CustomUserDetails principal) {
        notificationRepository.markAllAsReadForUser(principal.getId());
        return ApiResponse.ok(null, "All notifications marked as read");
    }
}
