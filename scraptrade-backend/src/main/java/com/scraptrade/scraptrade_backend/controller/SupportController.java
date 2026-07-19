package com.scraptrade.scraptrade_backend.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/support")
public class SupportController {

    private final String email;
    private final String phone;
    private final String whatsappUrl;
    private final String hours;

    public SupportController(
            @Value("${app.support.email:support@scraptrade.com}") String email,
            @Value("${app.support.phone:+233302123456}") String phone,
            @Value("${app.support.whatsapp:https://wa.me/233302123456}") String whatsappUrl,
            @Value("${app.support.hours:Mon-Sat, 8am-6pm GMT}") String hours) {
        this.email = email;
        this.phone = phone;
        this.whatsappUrl = whatsappUrl;
        this.hours = hours;
    }

    @GetMapping
    public Map<String, String> getSupportInfo() {
        return Map.of(
                "email", email,
                "phone", phone,
                "whatsappUrl", whatsappUrl,
                "hours", hours);
    }
}
