package com.desafiotecnico.academico.turma.interfaces.rest;

import com.desafiotecnico.academico.turma.application.dto.TurmaRequest;
import com.desafiotecnico.academico.turma.application.dto.TurmaResponse;
import com.desafiotecnico.academico.turma.application.service.TurmaService;
import io.swagger.v3.oas.annotations.Operation;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/api/turmas")
public class TurmaController {

    private final TurmaService turmaService;

    public TurmaController(TurmaService turmaService) {
        this.turmaService = turmaService;
    }

    @PostMapping
    @Operation(summary = "Cria turma")
    public ResponseEntity<TurmaResponse> create(@Valid @RequestBody TurmaRequest request) {
        TurmaResponse response = turmaService.create(request);
        URI location = ServletUriComponentsBuilder.fromCurrentRequest()
                .path("/{id}")
                .buildAndExpand(response.id())
                .toUri();
        return ResponseEntity.created(location).body(response);
    }

    @GetMapping
    @Operation(summary = "Lista turmas")
    public ResponseEntity<List<TurmaResponse>> findAll() {
        return ResponseEntity.ok(turmaService.findAll());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Consulta turma por id")
    public ResponseEntity<TurmaResponse> findById(@PathVariable Long id) {
        return ResponseEntity.ok(turmaService.findById(id));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Atualiza turma")
    public ResponseEntity<TurmaResponse> update(@PathVariable Long id, @Valid @RequestBody TurmaRequest request) {
        return ResponseEntity.ok(turmaService.update(id, request));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Exclui turma")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        turmaService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
