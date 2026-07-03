package com.vobworkbench.feature.vob.entity;

import java.time.LocalDate;

public class InsurancePolicy {

    private String payerName;
    private String memberId;
    private String groupNumber;
    private String planType;
    private RelationshipToSubscriber relationshipToSubscriber;
    private LocalDate coverageStart;
    private LocalDate coverageEnd;

    public String getPayerName() {

        return payerName;
    }

    public void setPayerName(String payerName) {

        this.payerName = payerName;
    }

    public String getMemberId() {

        return memberId;
    }

    public void setMemberId(String memberId) {

        this.memberId = memberId;
    }

    public String getGroupNumber() {

        return groupNumber;
    }

    public void setGroupNumber(String groupNumber) {

        this.groupNumber = groupNumber;
    }

    public String getPlanType() {

        return planType;
    }

    public void setPlanType(String planType) {

        this.planType = planType;
    }

    public RelationshipToSubscriber getRelationshipToSubscriber() {

        return relationshipToSubscriber;
    }

    public void setRelationshipToSubscriber(RelationshipToSubscriber relationshipToSubscriber) {

        this.relationshipToSubscriber = relationshipToSubscriber;
    }

    public LocalDate getCoverageStart() {

        return coverageStart;
    }

    public void setCoverageStart(LocalDate coverageStart) {

        this.coverageStart = coverageStart;
    }

    public LocalDate getCoverageEnd() {

        return coverageEnd;
    }

    public void setCoverageEnd(LocalDate coverageEnd) {

        this.coverageEnd = coverageEnd;
    }
}
