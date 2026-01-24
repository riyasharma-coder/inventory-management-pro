package com.example.spring_p1.repository; // Ensure this matches your package structure

import com.example.spring_p1.entity.Product;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ProductRepository extends MongoRepository<Product, String> {
    // MongoRepository automatically supports CRUD and Pagination (Pageable)
    // You don't need to add any methods here for basic functionality!
}
