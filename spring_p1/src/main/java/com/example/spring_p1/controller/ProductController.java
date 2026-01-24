package com.example.spring_p1.controller;

import com.example.spring_p1.entity.Product;
import com.example.spring_p1.repository.ProductRepository;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/products")
@CrossOrigin(origins = "*") // FIX 1: Allows Vercel to talk to Render
@Validated
public class ProductController {

    @Autowired
    private ProductRepository productRepository;

    // ================= CREATE =================
    @PostMapping
    public ResponseEntity<Product> addProduct(@RequestBody @Valid Product product) {
        Product saved = productRepository.save(product);
        return ResponseEntity.ok(saved);
    }

    // ================= READ ALL (SIMPLIFIED) =================
    @GetMapping
    public List<Product> getAllProducts() {
        // FIX 2: Returns a simple List [] that your frontend can understand immediately
        return productRepository.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Product> getProduct(@PathVariable String id) {
        return productRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}")
    public ResponseEntity<Product> updateProduct(@PathVariable String id, @RequestBody @Valid Product productDetails) {
        return productRepository.findById(id)
                .map(existingProduct -> {
                    existingProduct.setName(productDetails.getName());
                    existingProduct.setQuantity(productDetails.getQuantity());
                    existingProduct.setPrice(productDetails.getPrice());
                    existingProduct.setCategory(productDetails.getCategory());
                    existingProduct.setImageUrl(productDetails.getImageUrl());
                    return ResponseEntity.ok(productRepository.save(existingProduct));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteProduct(@PathVariable String id) {
        if (!productRepository.existsById(id)) return ResponseEntity.notFound().build();
        productRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}

