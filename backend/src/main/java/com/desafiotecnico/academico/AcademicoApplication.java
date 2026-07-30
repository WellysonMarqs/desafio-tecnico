package com.desafiotecnico.academico;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@EnableScheduling
@SpringBootApplication
public class AcademicoApplication {

    public static void main(String[] args) {
        SpringApplication.run(AcademicoApplication.class, args);
    }
}
