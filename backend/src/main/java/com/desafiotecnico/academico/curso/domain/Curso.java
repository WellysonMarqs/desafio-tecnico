package com.desafiotecnico.academico.curso.domain;

import jakarta.persistence.*;

@Entity
@Table(name = "cursos", uniqueConstraints = {
        @UniqueConstraint(name = "uk_curso_codigo", columnNames = "codigo")
})
public class Curso {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 150)
    private String nome;

    @Column(nullable = false, length = 30)
    private String codigo;

    public Long getId() {
        return id;
    }

    public String getNome() {
        return nome;
    }

    public void setNome(String nome) {
        this.nome = nome;
    }

    public String getCodigo() {
        return codigo;
    }

    public void setCodigo(String codigo) {
        this.codigo = codigo;
    }
}
