package com.desafiotecnico.academico.matricula.domain;

import com.desafiotecnico.academico.aluno.domain.Aluno;
import com.desafiotecnico.academico.turma.domain.Turma;
import jakarta.persistence.*;

import java.time.OffsetDateTime;

@Entity
@Table(name = "matriculas", uniqueConstraints = {
        @UniqueConstraint(name = "uk_matricula_aluno_turma", columnNames = {"aluno_id", "turma_id"})
})
public class Matricula {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "aluno_id", nullable = false, foreignKey = @ForeignKey(name = "fk_matricula_aluno"))
    private Aluno aluno;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "turma_id", nullable = false, foreignKey = @ForeignKey(name = "fk_matricula_turma"))
    private Turma turma;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private MatriculaStatus status;

    @Column(name = "criada_em", nullable = false)
    private OffsetDateTime criadaEm;

    @Column(name = "confirmada_em")
    private OffsetDateTime confirmadaEm;

    @Column(name = "cancelada_em")
    private OffsetDateTime canceladaEm;

    @PrePersist
    public void prePersist() {
        if (criadaEm == null) {
            criadaEm = OffsetDateTime.now();
        }
    }

    public Long getId() {
        return id;
    }

    public Aluno getAluno() {
        return aluno;
    }

    public void setAluno(Aluno aluno) {
        this.aluno = aluno;
    }

    public Turma getTurma() {
        return turma;
    }

    public void setTurma(Turma turma) {
        this.turma = turma;
    }

    public MatriculaStatus getStatus() {
        return status;
    }

    public void setStatus(MatriculaStatus status) {
        this.status = status;
    }

    public OffsetDateTime getCriadaEm() {
        return criadaEm;
    }

    public OffsetDateTime getConfirmadaEm() {
        return confirmadaEm;
    }

    public void setConfirmadaEm(OffsetDateTime confirmadaEm) {
        this.confirmadaEm = confirmadaEm;
    }

    public OffsetDateTime getCanceladaEm() {
        return canceladaEm;
    }

    public void setCanceladaEm(OffsetDateTime canceladaEm) {
        this.canceladaEm = canceladaEm;
    }
}
