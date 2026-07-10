package com.vobworkbench.feature.vob.dto;

import com.vobworkbench.feature.vob.entity.VobPriority;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.FutureOrPresent;

import java.time.LocalDate;

public record VobRequestDTO(

        @NotBlank String patientId,
        @NotNull @Valid InsurancePolicyRequestDTO insurance,
        @NotNull @FutureOrPresent(message = "must not be in the past") LocalDate dateOfService,
        @NotNull VobPriority priority) {
}
