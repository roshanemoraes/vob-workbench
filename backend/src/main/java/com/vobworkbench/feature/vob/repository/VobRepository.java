package com.vobworkbench.feature.vob.repository;

import com.vobworkbench.feature.vob.entity.Vob;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface VobRepository extends MongoRepository<Vob, String> {

    Optional<Vob> findByPublicId(String publicId);
}
