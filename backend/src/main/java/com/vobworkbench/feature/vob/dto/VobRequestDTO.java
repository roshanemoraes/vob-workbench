package com.vobworkbench.feature.vob.dto;

import com.vobworkbench.feature.vob.entity.VobPriority;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

public record VobRequestDTO(

        @NotBlank String patientId,
        @NotNull @Valid InsurancePolicyRequestDTO insurance,
        @NotNull LocalDate dateOfService,
        @NotNull VobPriority priority) {
}
