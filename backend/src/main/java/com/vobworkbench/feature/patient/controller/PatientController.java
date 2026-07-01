package com.vobworkbench.feature.patient.controller;

import com.vobworkbench.core.security.SecurityExpressions;
import com.vobworkbench.feature.patient.dto.CreatePatientRequest;
import com.vobworkbench.feature.patient.dto.PatientPageResponse;
import com.vobworkbench.feature.patient.dto.PatientResponse;
import com.vobworkbench.feature.patient.service.PatientService;
import com.vobworkbench.feature.user.service.UserPrincipal;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
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

@Validated
@RestController
@RequestMapping("/api/patients")
public class PatientController {

    private final PatientService patientService;

    public PatientController(PatientService patientService) {
        this.patientService = patientService;
    }

    @PostMapping
    @PreAuthorize(SecurityExpressions.PATIENT_CREATE)
    ResponseEntity<PatientResponse> createPatient(
            @Valid @RequestBody CreatePatientRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(patientService.create(request, principal.getId()));
    }

    @GetMapping("/{id}")
    @PreAuthorize(SecurityExpressions.PATIENT_VIEW)
    ResponseEntity<PatientResponse> getPatientById(@PathVariable String id) {
        return ResponseEntity.ok(patientService.getById(id));
    }

    @GetMapping
    @PreAuthorize(SecurityExpressions.PATIENT_VIEW)
    ResponseEntity<PatientPageResponse> getPatients(
            @RequestParam(required = false) String cursor,
            @RequestParam(defaultValue = "20") @Min(1) @Max(100) int limit) {
        return ResponseEntity.ok(patientService.list(cursor, limit));
    }
}
