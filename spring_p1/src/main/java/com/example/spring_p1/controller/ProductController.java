package com.example.spring_p1.controller;

import com.example.spring_p1.entity.Product;
import com.example.spring_p1.repository.ProductRepository;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

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

    // ================= READ ALL (SORT + FILTER) =================
    @GetMapping
    public List<Product> getAllProducts(
            @RequestParam(required = false) String sortBy,
            @RequestParam(defaultValue = "asc") String order,
            @RequestParam(required = false) Integer minQuantity,
            @RequestParam(required = false) Double maxPrice
    ) {
        // fetch all products
        List<Product> products = productRepository.findAll();

        // apply filtering
        if (minQuantity != null) {
            products = products.stream()
                    .filter(p -> p.getQuantity() >= minQuantity)
                    .collect(Collectors.toList());
        }
        if (maxPrice != null) {
            products = products.stream()
                    .filter(p -> p.getPrice() <= maxPrice)
                    .collect(Collectors.toList());
        }

        // apply sorting
        if (sortBy != null) {
            Sort.Direction direction = order.equalsIgnoreCase("desc") ? Sort.Direction.DESC : Sort.Direction.ASC;
            products = products.stream()
                    .sorted((p1, p2) -> {
                        if (sortBy.equalsIgnoreCase("name")) {
                            return direction.isAscending()
                                    ? p1.getName().compareTo(p2.getName())
                                    : p2.getName().compareTo(p1.getName());
                        } else if (sortBy.equalsIgnoreCase("quantity")) {
                            return direction.isAscending()
                                    ? Integer.compare(p1.getQuantity(), p2.getQuantity())
                                    : Integer.compare(p2.getQuantity(), p1.getQuantity());
                        } else if (sortBy.equalsIgnoreCase("price")) {
                            return direction.isAscending()
                                    ? Double.compare(p1.getPrice(), p2.getPrice())
                                    : Double.compare(p2.getPrice(), p1.getPrice());
                        }
                        return 0;
                    })
                    .collect(Collectors.toList());
        }

        return products;
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
