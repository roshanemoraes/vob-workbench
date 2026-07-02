package com.vobworkbench.feature.vob.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.vobworkbench.core.security.SecurityExpressions;
import com.vobworkbench.feature.user.service.UserPrincipal;
import com.vobworkbench.feature.vob.dto.VobQueueResponseDTO;
import com.vobworkbench.feature.vob.dto.VobRequestDTO;
import com.vobworkbench.feature.vob.dto.VobResponseDTO;
import com.vobworkbench.feature.vob.entity.VobStatus;
import com.vobworkbench.feature.vob.service.VobService;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

@Validated
@RestController
@RequestMapping("/api/vob")
public class VobController {

    private final VobService vobService;

    public VobController(VobService vobService) {

        this.vobService = vobService;
    }

    @PostMapping
    @PreAuthorize(SecurityExpressions.VOB_CREATE)
    ResponseEntity<VobResponseDTO> createVob(
            @Valid @RequestBody VobRequestDTO request,
            @AuthenticationPrincipal UserPrincipal principal) {

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(vobService.createVob(request, principal.getId()));
    }

    @GetMapping("/{id}")
    @PreAuthorize(SecurityExpressions.VOB_VIEW)
    ResponseEntity<VobResponseDTO> getVobById(
            @PathVariable String id,
            @AuthenticationPrincipal UserPrincipal principal) {

        return ResponseEntity.ok(vobService.getVobById(id, principal));
    }

    @GetMapping
    @PreAuthorize(SecurityExpressions.VOB_VIEW)
    ResponseEntity<VobQueueResponseDTO> listVobsByStatus(
            @RequestParam VobStatus status,
            @RequestParam(required = false) String cursor,
            @RequestParam(defaultValue = "20") @Min(1) @Max(100) int limit,
            @RequestParam(defaultValue = "asc") String sortOrder,
            @AuthenticationPrincipal UserPrincipal principal) {

        return ResponseEntity.ok(vobService.getVobListByStatus(status, cursor, limit, sortOrder, principal));
    }
}
