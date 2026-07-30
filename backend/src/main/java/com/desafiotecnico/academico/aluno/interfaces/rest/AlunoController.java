package com.desafiotecnico.academico.aluno.interfaces.rest;

import com.desafiotecnico.academico.aluno.application.dto.AlunoRequest;
import com.desafiotecnico.academico.aluno.application.dto.AlunoResponse;
import com.desafiotecnico.academico.aluno.application.service.AlunoService;
import io.swagger.v3.oas.annotations.Operation;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/api/alunos")
public class AlunoController {

    private final AlunoService alunoService;

    public AlunoController(AlunoService alunoService) {
        this.alunoService = alunoService;
    }

    @PostMapping
    @Operation(summary = "Cria um aluno")
    public ResponseEntity<AlunoResponse> create(@Valid @RequestBody AlunoRequest request) {
        AlunoResponse response = alunoService.create(request);
        URI location = ServletUriComponentsBuilder.fromCurrentRequest()
                .path("/{id}")
                .buildAndExpand(response.id())
                .toUri();
        return ResponseEntity.created(location).body(response);
    }

    @GetMapping
    @Operation(summary = "Lista alunos")
    public ResponseEntity<List<AlunoResponse>> findAll() {
        return ResponseEntity.ok(alunoService.findAll());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Consulta aluno por id")
    public ResponseEntity<AlunoResponse> findById(@PathVariable Long id) {
        return ResponseEntity.ok(alunoService.findById(id));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Atualiza aluno")
    public ResponseEntity<AlunoResponse> update(@PathVariable Long id, @Valid @RequestBody AlunoRequest request) {
        return ResponseEntity.ok(alunoService.update(id, request));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Exclui aluno")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        alunoService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
