package com.feedefaulter.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.io.File;

@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        File uploadDir = new File("src/main/resources/static/uploads/");
        if (!uploadDir.exists()) {
            uploadDir = new File("backend-java/src/main/resources/static/uploads/");
        }

        String uploadPath = uploadDir.getAbsolutePath();
        System.out.println("[INFO] Mapping /uploads/** static route to physical path: " + uploadPath);
        
        registry.addResourceHandler("/uploads/**")
                .addResourceLocations("file:" + uploadPath + "/");
    }
}
