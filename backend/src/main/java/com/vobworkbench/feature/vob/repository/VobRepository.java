package com.vobworkbench.feature.vob.repository;

import com.vobworkbench.feature.vob.entity.Vob;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface VobRepository extends MongoRepository<Vob, String> {
}
