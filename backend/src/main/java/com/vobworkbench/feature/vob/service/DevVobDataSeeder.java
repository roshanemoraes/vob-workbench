package com.vobworkbench.feature.vob.service;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import com.vobworkbench.feature.patient.entity.Gender;
import com.vobworkbench.feature.patient.entity.Patient;
import com.vobworkbench.feature.patient.repository.PatientRepository;
import com.vobworkbench.feature.user.entity.AppUser;
import com.vobworkbench.feature.user.repository.UserRepository;
import com.vobworkbench.feature.vob.entity.EligibilityResult;
import com.vobworkbench.feature.vob.entity.InsurancePolicy;
import com.vobworkbench.feature.vob.entity.NetworkStatus;
import com.vobworkbench.feature.vob.entity.RelationshipToSubscriber;
import com.vobworkbench.feature.vob.entity.VerificationMethod;
import com.vobworkbench.feature.vob.entity.Vob;
import com.vobworkbench.feature.vob.entity.VobPriority;
import com.vobworkbench.feature.vob.entity.VobStatus;
import com.vobworkbench.feature.vob.repository.VobRepository;

@Component
@Order(2)
@ConditionalOnProperty(name = "vob.dev-seed.enabled", havingValue = "true")
public class DevVobDataSeeder implements CommandLineRunner {

    private final PatientRepository patientRepository;
    private final UserRepository userRepository;
    private final VobRepository vobRepository;

    public DevVobDataSeeder(
            PatientRepository patientRepository,
            UserRepository userRepository,
            VobRepository vobRepository) {

        this.patientRepository = patientRepository;
        this.userRepository = userRepository;
        this.vobRepository = vobRepository;
    }

    @Override
    public void run(String... args) {

        if (vobRepository.count() > 0) {
            return;
        }

        String frontDeskUserId = userId("frontdesk");
        String specialistUserId = userId("specialist");

        Patient maria = seedPatient(
                "MRN-10001",
                "Maria",
                "Garcia",
                LocalDate.of(1985, 3, 12),
                Gender.FEMALE,
                "555-0101",
                frontDeskUserId);

        Patient james = seedPatient(
                "MRN-10002",
                "James",
                "Wilson",
                LocalDate.of(1972, 11, 28),
                Gender.MALE,
                "555-0102",
                frontDeskUserId);

        Patient priya = seedPatient(
                "MRN-10003",
                "Priya",
                "Patel",
                LocalDate.of(1990, 7, 4),
                Gender.FEMALE,
                "555-0103",
                frontDeskUserId);

        List<Vob> vobs = List.of(
                Vob.builder()
                        .patientId(maria.getId())
                        .insurancePolicy(policy("BlueCross PPO", "BC123456", "GRP-100", "PPO", RelationshipToSubscriber.SELF))
                        .dateOfService(LocalDate.now().plusDays(7))
                        .priority(VobPriority.URGENT)
                        .status(VobStatus.QUEUED)
                        .createdByUserId(frontDeskUserId)
                        .build(),
                Vob.builder()
                        .patientId(james.getId())
                        .insurancePolicy(policy("Aetna HMO", "AE789012", "GRP-200", "HMO", RelationshipToSubscriber.SELF))
                        .dateOfService(LocalDate.now().plusDays(3))
                        .priority(VobPriority.ROUTINE)
                        .status(VobStatus.IN_PROGRESS)
                        .assignedToUserId(specialistUserId)
                        .createdByUserId(frontDeskUserId)
                        .build(),
                Vob.builder()
                        .patientId(priya.getId())
                        .insurancePolicy(policy("UnitedHealthcare", "UH345678", "GRP-300", "EPO", RelationshipToSubscriber.SELF))
                        .dateOfService(LocalDate.now().minusDays(5))
                        .priority(VobPriority.ROUTINE)
                        .status(VobStatus.VERIFIED)
                        .assignedToUserId(specialistUserId)
                        .eligibilityResult(verifiedResult(specialistUserId))
                        .createdByUserId(frontDeskUserId)
                        .build(),
                Vob.builder()
                        .patientId(maria.getId())
                        .insurancePolicy(policy("Cigna", "CI112233", "GRP-400", "PPO", RelationshipToSubscriber.SPOUSE))
                        .dateOfService(LocalDate.now().minusDays(20))
                        .priority(VobPriority.ROUTINE)
                        .status(VobStatus.FAILED_TO_VERIFY)
                        .assignedToUserId(specialistUserId)
                        .eligibilityResult(failedResult(specialistUserId))
                        .createdByUserId(frontDeskUserId)
                        .build()
        );

        vobRepository.saveAll(vobs);
    }

    private String userId(String username) {

        return userRepository.findByUsername(username)
                .map(AppUser::getId)
                .orElse(username);
    }

    private Patient seedPatient(
            String mrn,
            String firstName,
            String lastName,
            LocalDate dateOfBirth,
            Gender gender,
            String phone,
            String createdByUserId) {

        return patientRepository.findByMrn(mrn)
                .orElseGet(() -> {
                    Patient patient = new Patient();
                    patient.setMrn(mrn);
                    patient.setFirstName(firstName);
                    patient.setLastName(lastName);
                    patient.setDateOfBirth(dateOfBirth);
                    patient.setGender(gender);
                    patient.setPhone(phone);
                    patient.setCreatedByUserId(createdByUserId);
                    return patientRepository.save(patient);
                });
    }

    private InsurancePolicy policy(
            String payerName,
            String memberId,
            String groupNumber,
            String planType,
            RelationshipToSubscriber relationship) {

        InsurancePolicy policy = new InsurancePolicy();
        policy.setPayerName(payerName);
        policy.setMemberId(memberId);
        policy.setGroupNumber(groupNumber);
        policy.setPlanType(planType);
        policy.setRelationshipToSubscriber(relationship);
        policy.setCoverageStart(LocalDate.now().withDayOfYear(1));
        policy.setCoverageEnd(LocalDate.now().withMonth(12).withDayOfMonth(31));
        return policy;
    }

    private EligibilityResult verifiedResult(String specialistUserId) {

        EligibilityResult result = new EligibilityResult();
        result.setCoverageActive(true);
        result.setNetworkStatus(NetworkStatus.IN_NETWORK);
        result.setCopay(new BigDecimal("25.00"));
        result.setCoinsurancePercent(new BigDecimal("20.00"));
        result.setDeductibleTotal(new BigDecimal("1500.00"));
        result.setDeductibleMet(new BigDecimal("500.00"));
        result.setOopMax(new BigDecimal("6000.00"));
        result.setOopMet(new BigDecimal("1250.00"));
        result.setNotes("Verified with synthetic payer response.");
        result.setReferenceNumber("REF-998877");
        result.setVerifiedByUserId(specialistUserId);
        result.setVerifiedAt(Instant.now().minusSeconds(3600));
        result.setVerificationMethod(VerificationMethod.API);
        return result;
    }

    private EligibilityResult failedResult(String specialistUserId) {

        EligibilityResult result = new EligibilityResult();
        result.setCoverageActive(false);
        result.setNetworkStatus(NetworkStatus.UNKNOWN);
        result.setNotes("Could not confirm active coverage with synthetic payer data.");
        result.setFailureReason("Coverage not active for date of service");
        result.setVerifiedByUserId(specialistUserId);
        result.setVerifiedAt(Instant.now().minusSeconds(7200));
        result.setVerificationMethod(VerificationMethod.MANUAL);
        return result;
    }
}
