package com.example.spring_p1.entity;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import jakarta.validation.constraints.*;
import lombok.*;

@Document(collection = "products")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Product {

    @Id
    private String id;

    @NotBlank(message = "Name cannot be empty")
    private String name;

    private String category;
    private String imageUrl;

    @Min(value = 0, message = "Quantity cannot be negative")
    private int quantity;

    @DecimalMin(value = "0.01", message = "Price must be greater than 0")
    private double price;
}
