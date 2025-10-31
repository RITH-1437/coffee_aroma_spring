package com.api.coffeeproject.Config;

import com.api.coffeeproject.Model.UserModel;
import com.api.coffeeproject.Model.CategoryModel;
import com.api.coffeeproject.Model.ProductModel;
import com.api.coffeeproject.Model.OrderModel;
import com.api.coffeeproject.Model.OrderType;
import com.api.coffeeproject.Model.OrderStatus;
import com.api.coffeeproject.Model.PaymentStatus;
import com.api.coffeeproject.Service.UserService;
import com.api.coffeeproject.Service.CategoryService;
import com.api.coffeeproject.Service.ProductService;
import com.api.coffeeproject.Service.OrderService;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class DataSeeder implements CommandLineRunner {

    private final UserService userService;
    private final CategoryService categoryService;
    private final ProductService productService;
    private final OrderService orderService;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    public DataSeeder(UserService userService, CategoryService categoryService, ProductService productService, OrderService orderService) {
        this.userService = userService;
        this.categoryService = categoryService;
        this.productService = productService;
        this.orderService = orderService;
    }

    @Override
    public void run(String... args) throws Exception {
        // Create default admin user if doesn't exist
        if (!userService.getByEmail("admin@cafearoma.com").isPresent()) {
            UserModel admin = new UserModel();
            admin.setFirstName("Admin");
            admin.setLastName("User");
            admin.setEmail("admin@cafearoma.com");
            admin.setPasswordHash(passwordEncoder.encode("admin123"));
            admin.setRole("administrator");
            admin.setIsActive(true);
            admin.setEmailVerified(true);
            
            userService.save(admin);
            System.out.println("✅ Default admin user created: admin@cafearoma.com / admin123");
        }

        // Create default customer user if doesn't exist
        if (!userService.getByEmail("user@example.com").isPresent()) {
            UserModel customer = new UserModel();
            customer.setFirstName("John");
            customer.setLastName("Doe");
            customer.setEmail("user@example.com");
            customer.setPasswordHash(passwordEncoder.encode("password"));
            customer.setRole("customer");
            customer.setIsActive(true);
            customer.setEmailVerified(true);
            
            userService.save(customer);
            System.out.println("✅ Default customer user created: user@example.com / password");
        }

        // Create default categories
        createDefaultCategories();

        // Create default products
        createDefaultProducts();
        
        // Create default orders
        createDefaultOrders();
    }

    private void createDefaultCategories() {
        // Only create if no categories exist
        if (categoryService.getAll().isEmpty()) {
            System.out.println("📂 Creating default categories...");

            // Coffee category
            CategoryModel coffee = CategoryModel.builder()
                    .name("Coffee")
                    .description("Hot and cold coffee beverages")
                    .imageUrl("https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=400&h=300&fit=crop")
                    .isActive(true)
                    .sortOrder(1)
                    .build();
            categoryService.save(coffee);

            // Pastries category  
            CategoryModel pastries = CategoryModel.builder()
                    .name("Pastries")
                    .description("Fresh baked goods and desserts")
                    .imageUrl("https://images.unsplash.com/photo-1555507036-ab794f4d4a6b?w=400&h=300&fit=crop")
                    .isActive(true)
                    .sortOrder(2)
                    .build();
            categoryService.save(pastries);

            // Cold Drinks category
            CategoryModel coldDrinks = CategoryModel.builder()
                    .name("Cold Drinks")
                    .description("Refreshing cold beverages and smoothies")
                    .imageUrl("https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400&h=300&fit=crop")
                    .isActive(true)
                    .sortOrder(3)
                    .build();
            categoryService.save(coldDrinks);

            // Snacks category
            CategoryModel snacks = CategoryModel.builder()
                    .name("Snacks")
                    .description("Light bites and healthy snacks")
                    .imageUrl("https://images.unsplash.com/photo-1551024506-0bccd828d307?w=400&h=300&fit=crop")
                    .isActive(true)
                    .sortOrder(4)
                    .build();
            categoryService.save(snacks);

            System.out.println("✅ Default categories created: Coffee, Pastries, Cold Drinks, Snacks");
        }
    }

    private void createDefaultProducts() {
        // Only create if no products exist
        if (productService.getAllProducts().isEmpty()) {
            System.out.println("🛍️ Creating default products...");

            // Coffee products (Category ID 1)
            ProductModel espresso = ProductModel.builder()
                    .name("Classic Espresso")
                    .description("Rich and bold espresso shot")
                    .price(3.50)
                    .categoryId(1L)
                    .imageUrl("https://images.unsplash.com/photo-1510707577719-ae7c14805e3a?w=400&h=300&fit=crop")
                    .isAvailable(true)
                    .isFeatured(true)
                    .stockQuantity(100)
                    .preparationTime(3)
                    .calories(5)
                    .ingredients("Premium coffee beans, water")
                    .allergens("None")
                    .build();
            productService.saveProduct(espresso);

            ProductModel cappuccino = ProductModel.builder()
                    .name("Cappuccino")
                    .description("Perfect balance of espresso, steamed milk, and foam")
                    .price(4.50)
                    .categoryId(1L)
                    .imageUrl("https://images.unsplash.com/photo-1534778101976-62847782c213?w=400&h=300&fit=crop")
                    .isAvailable(true)
                    .isFeatured(true)
                    .stockQuantity(100)
                    .preparationTime(5)
                    .calories(120)
                    .ingredients("Espresso, steamed milk, milk foam")
                    .allergens("Dairy")
                    .build();
            productService.saveProduct(cappuccino);

            ProductModel latte = ProductModel.builder()
                    .name("Caramel Latte")
                    .description("Smooth latte with sweet caramel syrup")
                    .price(5.00)
                    .categoryId(1L)
                    .imageUrl("https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400&h=300&fit=crop")
                    .isAvailable(true)
                    .isFeatured(false)
                    .stockQuantity(100)
                    .preparationTime(6)
                    .calories(250)
                    .ingredients("Espresso, steamed milk, caramel syrup")
                    .allergens("Dairy")
                    .build();
            productService.saveProduct(latte);

            // Pastries products (Category ID 2)
            ProductModel croissant = ProductModel.builder()
                    .name("Butter Croissant")
                    .description("Fresh baked buttery croissant")
                    .price(3.25)
                    .categoryId(2L)
                    .imageUrl("https://images.unsplash.com/photo-1555507036-ab794f4d4a6b?w=400&h=300&fit=crop")
                    .isAvailable(true)
                    .isFeatured(false)
                    .stockQuantity(50)
                    .preparationTime(2)
                    .calories(280)
                    .ingredients("Flour, butter, eggs, salt, yeast")
                    .allergens("Gluten, Dairy, Eggs")
                    .build();
            productService.saveProduct(croissant);

            ProductModel muffin = ProductModel.builder()
                    .name("Blueberry Muffin")
                    .description("Fluffy muffin with fresh blueberries")
                    .price(3.75)
                    .categoryId(2L)
                    .imageUrl("https://images.unsplash.com/photo-1607958996333-41aef7caefaa?w=400&h=300&fit=crop")
                    .isAvailable(true)
                    .isFeatured(true)
                    .stockQuantity(30)
                    .preparationTime(1)
                    .calories(320)
                    .ingredients("Flour, blueberries, sugar, eggs, butter")
                    .allergens("Gluten, Dairy, Eggs")
                    .build();
            productService.saveProduct(muffin);

            // Cold Drinks products (Category ID 3)
            ProductModel icedCoffee = ProductModel.builder()
                    .name("Iced Coffee")
                    .description("Refreshing cold brew coffee served over ice")
                    .price(4.00)
                    .categoryId(3L)
                    .imageUrl("https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400&h=300&fit=crop")
                    .isAvailable(true)
                    .isFeatured(false)
                    .stockQuantity(100)
                    .preparationTime(3)
                    .calories(15)
                    .ingredients("Cold brew coffee, ice")
                    .allergens("None")
                    .build();
            productService.saveProduct(icedCoffee);

            ProductModel smoothie = ProductModel.builder()
                    .name("Berry Smoothie")
                    .description("Fresh mixed berry smoothie with yogurt")
                    .price(5.50)
                    .categoryId(3L)
                    .imageUrl("https://images.unsplash.com/photo-1570197788417-0e82375c9371?w=400&h=300&fit=crop")
                    .isAvailable(true)
                    .isFeatured(true)
                    .stockQuantity(50)
                    .preparationTime(4)
                    .calories(180)
                    .ingredients("Mixed berries, yogurt, honey, ice")
                    .allergens("Dairy")
                    .build();
            productService.saveProduct(smoothie);

            // Snacks products (Category ID 4)
            ProductModel sandwich = ProductModel.builder()
                    .name("Chicken Avocado Sandwich")
                    .description("Grilled chicken with fresh avocado on artisan bread")
                    .price(7.50)
                    .categoryId(4L)
                    .imageUrl("https://images.unsplash.com/photo-1551024506-0bccd828d307?w=400&h=300&fit=crop")
                    .isAvailable(true)
                    .isFeatured(false)
                    .stockQuantity(25)
                    .preparationTime(8)
                    .calories(450)
                    .ingredients("Grilled chicken, avocado, lettuce, tomato, artisan bread")
                    .allergens("Gluten")
                    .build();
            productService.saveProduct(sandwich);

            System.out.println("✅ Default products created: 8 products across 4 categories");
        }
    }

    private void createDefaultOrders() {
        try {
            // Only create if no orders exist
            long orderCount = orderService.getTotalOrdersCount();
            System.out.println("🔍 Current order count: " + orderCount);
            
            if (orderCount == 0) {
                System.out.println("📋 Creating default orders...");

            // Order 1 - Completed coffee order
            OrderModel order1 = OrderModel.builder()
                    .orderNumber("ORD-00001")
                    .customerName("John Smith")
                    .customerEmail("john.smith@email.com")
                    .customerPhone("+1-555-0123")
                    .orderType(OrderType.pickup)
                    .status(OrderStatus.completed)
                    .subtotal(8.50)
                    .taxAmount(0.85)
                    .deliveryFee(0.0)
                    .totalAmount(9.35)
                    .paymentStatus(PaymentStatus.paid)
                    .paymentMethod("Credit Card")
                    .specialInstructions("Extra hot, no sugar")
                    .build();
            orderService.saveOrder(order1);

            // Order 2 - Pending delivery order
            OrderModel order2 = OrderModel.builder()
                    .orderNumber("ORD-00002")
                    .customerName("Emily Johnson")
                    .customerEmail("emily.johnson@email.com")
                    .customerPhone("+1-555-0234")
                    .orderType(OrderType.delivery)
                    .status(OrderStatus.preparing)
                    .subtotal(15.75)
                    .taxAmount(1.58)
                    .deliveryFee(3.50)
                    .totalAmount(20.83)
                    .paymentStatus(PaymentStatus.paid)
                    .paymentMethod("PayPal")
                    .specialInstructions("Ring doorbell, apartment 2B")
                    .deliveryAddress("123 Main Street, Apt 2B, City, State 12345")
                    .build();
            orderService.saveOrder(order2);

            // Order 3 - Dine-in order ready
            OrderModel order3 = OrderModel.builder()
                    .orderNumber("ORD-00003")
                    .customerName("Michael Brown")
                    .customerEmail("michael.brown@email.com")
                    .customerPhone("+1-555-0345")
                    .orderType(OrderType.dine_in)
                    .status(OrderStatus.ready)
                    .subtotal(12.25)
                    .taxAmount(1.23)
                    .deliveryFee(0.0)
                    .totalAmount(13.48)
                    .paymentStatus(PaymentStatus.paid)
                    .paymentMethod("Cash")
                    .specialInstructions("Table 5")
                    .build();
            orderService.saveOrder(order3);

            // Order 4 - New pending order
            OrderModel order4 = OrderModel.builder()
                    .orderNumber("ORD-00004")
                    .customerName("Sarah Davis")
                    .customerEmail("sarah.davis@email.com")
                    .customerPhone("+1-555-0456")
                    .orderType(OrderType.pickup)
                    .status(OrderStatus.pending)
                    .subtotal(6.50)
                    .taxAmount(0.65)
                    .deliveryFee(0.0)
                    .totalAmount(7.15)
                    .paymentStatus(PaymentStatus.pending)
                    .paymentMethod("Credit Card")
                    .specialInstructions("Oat milk instead of regular")
                    .build();
            orderService.saveOrder(order4);

            // Order 5 - Confirmed large order
            OrderModel order5 = OrderModel.builder()
                    .orderNumber("ORD-00005")
                    .customerName("David Wilson")
                    .customerEmail("david.wilson@email.com")
                    .customerPhone("+1-555-0567")
                    .orderType(OrderType.delivery)
                    .status(OrderStatus.confirmed)
                    .subtotal(24.75)
                    .taxAmount(2.48)
                    .deliveryFee(4.00)
                    .totalAmount(31.23)
                    .paymentStatus(PaymentStatus.paid)
                    .paymentMethod("Debit Card")
                    .specialInstructions("Office delivery, ask for reception")
                    .deliveryAddress("456 Business Ave, Suite 100, City, State 12345")
                    .build();
            orderService.saveOrder(order5);

                System.out.println("✅ Default orders created: 5 orders with various statuses");
            } else {
                System.out.println("📝 Orders already exist (" + orderCount + "), skipping creation");
            }
        } catch (Exception e) {
            System.err.println("❌ Error creating default orders: " + e.getMessage());
            e.printStackTrace();
        }
    }
}