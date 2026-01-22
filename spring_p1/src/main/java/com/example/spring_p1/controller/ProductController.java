package com.example.spring_p1.controller;

import com.example.spring_p1.entity.Product;
import com.example.spring_p1.repository.ProductRepository;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/products")
@CrossOrigin(origins = "http://localhost:5173")
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

    // ================= READ ALL (WITH PAGINATION & SORTING) =================
    @GetMapping
    public Page<Product> getAllProducts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "asc") String order
    ) {
        // Create Sort object based on parameters
        Sort sort = order.equalsIgnoreCase("desc")
                ? Sort.by(sortBy).descending()
                : Sort.by(sortBy).ascending();

        // Create Pageable object
        Pageable pageable = PageRequest.of(page, size, sort);

        // Fetch paginated results from DB (MAANG efficiency!)
        return productRepository.findAll(pageable);
    }

    // ================= READ ONE =================
    @GetMapping("/{id}")
    public ResponseEntity<Product> getProduct(@PathVariable int id) {
        return productRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // ================= UPDATE =================
    @PutMapping("/{id}")
    public ResponseEntity<Product> updateProduct(
            @PathVariable int id,
            @RequestBody @Valid Product product
    ) {
        if (!productRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }

        product.setId(id);
        Product updated = productRepository.save(product);
        return ResponseEntity.ok(updated);
    }

    // ================= DELETE =================
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteProduct(@PathVariable int id) {
        if (!productRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }

        productRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}