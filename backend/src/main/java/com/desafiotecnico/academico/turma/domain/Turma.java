package com.desafiotecnico.academico.turma.domain;

import com.desafiotecnico.academico.disciplina.domain.Disciplina;
import jakarta.persistence.*;

@Entity
@Table(name = "turmas", uniqueConstraints = {
        @UniqueConstraint(name = "uk_turma_codigo", columnNames = "codigo")
})
public class Turma {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 50)
    private String codigo;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "disciplina_id", nullable = false, foreignKey = @ForeignKey(name = "fk_turma_disciplina"))
    private Disciplina disciplina;

    @Column(nullable = false)
    private Integer capacidade;

    @Column(name = "vagas_disponiveis", nullable = false)
    private Integer vagasDisponiveis;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private TurmaStatus status;

    public Long getId() {
        return id;
    }

    public String getCodigo() {
        return codigo;
    }

    public void setCodigo(String codigo) {
        this.codigo = codigo;
    }

    public Disciplina getDisciplina() {
        return disciplina;
    }

    public void setDisciplina(Disciplina disciplina) {
        this.disciplina = disciplina;
    }

    public Integer getCapacidade() {
        return capacidade;
    }

    public void setCapacidade(Integer capacidade) {
        this.capacidade = capacidade;
    }

    public Integer getVagasDisponiveis() {
        return vagasDisponiveis;
    }

    public void setVagasDisponiveis(Integer vagasDisponiveis) {
        this.vagasDisponiveis = vagasDisponiveis;
    }

    public TurmaStatus getStatus() {
        return status;
    }

    public void setStatus(TurmaStatus status) {
        this.status = status;
    }
}
