package com.vobworkbench.feature.vob.entity;

import java.math.BigDecimal;
import java.time.Instant;

public class EligibilityResult {

    private Boolean coverageActive;

    private NetworkStatus networkStatus;

    private BigDecimal copay;

    private BigDecimal coinsurancePercent;

    private BigDecimal deductibleTotal;

    private BigDecimal deductibleMet;

    private BigDecimal oopMax;

    private BigDecimal oopMet;

    private String notes;

    private String verifiedByUserId;

    private Instant verifiedAt;

    private VerificationMethod verificationMethod;

    public Boolean getCoverageActive() {

        return coverageActive;
    }

    public void setCoverageActive(Boolean coverageActive) {

        this.coverageActive = coverageActive;
    }

    public NetworkStatus getNetworkStatus() {

        return networkStatus;
    }

    public void setNetworkStatus(NetworkStatus networkStatus) {

        this.networkStatus = networkStatus;
    }

    public BigDecimal getCopay() {

        return copay;
    }

    public void setCopay(BigDecimal copay) {

        this.copay = copay;
    }

    public BigDecimal getCoinsurancePercent() {

        return coinsurancePercent;
    }

    public void setCoinsurancePercent(BigDecimal coinsurancePercent) {

        this.coinsurancePercent = coinsurancePercent;
    }

    public BigDecimal getDeductibleTotal() {

        return deductibleTotal;
    }

    public void setDeductibleTotal(BigDecimal deductibleTotal) {

        this.deductibleTotal = deductibleTotal;
    }

    public BigDecimal getDeductibleMet() {

        return deductibleMet;
    }

    public void setDeductibleMet(BigDecimal deductibleMet) {

        this.deductibleMet = deductibleMet;
    }

    public BigDecimal getOopMax() {

        return oopMax;
    }

    public void setOopMax(BigDecimal oopMax) {

        this.oopMax = oopMax;
    }

    public BigDecimal getOopMet() {

        return oopMet;
    }

    public void setOopMet(BigDecimal oopMet) {

        this.oopMet = oopMet;
    }

    public String getNotes() {

        return notes;
    }

    public void setNotes(String notes) {

        this.notes = notes;
    }

    public String getVerifiedByUserId() {

        return verifiedByUserId;
    }

    public void setVerifiedByUserId(String verifiedByUserId) {

        this.verifiedByUserId = verifiedByUserId;
    }

    public Instant getVerifiedAt() {

        return verifiedAt;
    }

    public void setVerifiedAt(Instant verifiedAt) {

        this.verifiedAt = verifiedAt;
    }

    public VerificationMethod getVerificationMethod() {

        return verificationMethod;
    }

    public void setVerificationMethod(VerificationMethod verificationMethod) {

        this.verificationMethod = verificationMethod;
    }
}
