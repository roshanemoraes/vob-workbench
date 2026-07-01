package com.vobworkbench.feature.user.repository;

import com.vobworkbench.feature.user.entity.AppUser;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface UserRepository extends MongoRepository<AppUser, String> {

    Optional<AppUser> findByUsername(String username);

    boolean existsByUsername(String username);
}
