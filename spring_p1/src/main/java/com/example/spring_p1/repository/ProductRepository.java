package com.example.spring_p1.repository;

import com.example.spring_p1.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface ProductRepository
        extends JpaRepository<Product, Integer>,
        JpaSpecificationExecutor<Product> {
}

