package com.vobworkbench.feature.vob.entity;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.annotation.Version;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.time.LocalDate;

@Document(collection = "vob")
@CompoundIndex(name = "vob_queue_cursor_idx", def = "{'status': 1, 'createdAt': 1, '_id': 1}")
public class Vob {

    @Id
    private String id;

    @Version
    private Long version;

    @Indexed
    private String patientId;

    private InsurancePolicy insurancePolicy;

    private LocalDate dateOfService;

    private VobPriority priority;

    @Indexed
    private VobStatus status;

    @Indexed
    private String assignedToUserId;

    private EligibilityResult eligibilityResult;

    @Indexed
    private String createdByUserId;

    @CreatedDate
    private Instant createdAt;

    @LastModifiedDate
    private Instant updatedAt;

    public static Builder builder() {

        return new Builder();
    }

    public String getId() {

        return id;
    }

    public Long getVersion() {

        return version;
    }

    public String getPatientId() {

        return patientId;
    }

    public void setPatientId(String patientId) {

        this.patientId = patientId;
    }

    public InsurancePolicy getInsurancePolicy() {

        return insurancePolicy;
    }

    public void setInsurancePolicy(InsurancePolicy insurancePolicy) {

        this.insurancePolicy = insurancePolicy;
    }

    public LocalDate getDateOfService() {

        return dateOfService;
    }

    public void setDateOfService(LocalDate dateOfService) {

        this.dateOfService = dateOfService;
    }

    public VobPriority getPriority() {

        return priority;
    }

    public void setPriority(VobPriority priority) {

        this.priority = priority;
    }

    public VobStatus getStatus() {

        return status;
    }

    public void setStatus(VobStatus status) {

        this.status = status;
    }

    public String getAssignedToUserId() {

        return assignedToUserId;
    }

    public void setAssignedToUserId(String assignedToUserId) {

        this.assignedToUserId = assignedToUserId;
    }

    public EligibilityResult getEligibilityResult() {

        return eligibilityResult;
    }

    public void setEligibilityResult(EligibilityResult eligibilityResult) {

        this.eligibilityResult = eligibilityResult;
    }

    public String getCreatedByUserId() {

        return createdByUserId;
    }

    public void setCreatedByUserId(String createdByUserId) {

        this.createdByUserId = createdByUserId;
    }

    public Instant getCreatedAt() {

        return createdAt;
    }

    public Instant getUpdatedAt() {

        return updatedAt;
    }

    public static class Builder {

        private final Vob vob = new Vob();

        public Builder patientId(String patientId) {

            vob.setPatientId(patientId);
            return this;
        }

        public Builder insurancePolicy(InsurancePolicy insurancePolicy) {

            vob.setInsurancePolicy(insurancePolicy);
            return this;
        }

        public Builder dateOfService(LocalDate dateOfService) {

            vob.setDateOfService(dateOfService);
            return this;
        }

        public Builder priority(VobPriority priority) {

            vob.setPriority(priority);
            return this;
        }

        public Builder status(VobStatus status) {

            vob.setStatus(status);
            return this;
        }

        public Builder assignedToUserId(String assignedToUserId) {

            vob.setAssignedToUserId(assignedToUserId);
            return this;
        }

        public Builder eligibilityResult(EligibilityResult eligibilityResult) {

            vob.setEligibilityResult(eligibilityResult);
            return this;
        }

        public Builder createdByUserId(String createdByUserId) {

            vob.setCreatedByUserId(createdByUserId);
            return this;
        }

        public Vob build() {

            return vob;
        }
    }
}
