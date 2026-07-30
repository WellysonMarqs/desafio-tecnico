package com.desafiotecnico.academico.disciplina.interfaces.rest;

import com.desafiotecnico.academico.disciplina.application.dto.DisciplinaRequest;
import com.desafiotecnico.academico.disciplina.application.dto.DisciplinaResponse;
import com.desafiotecnico.academico.disciplina.application.service.DisciplinaService;
import io.swagger.v3.oas.annotations.Operation;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/api/disciplinas")
public class DisciplinaController {

    private final DisciplinaService disciplinaService;

    public DisciplinaController(DisciplinaService disciplinaService) {
        this.disciplinaService = disciplinaService;
    }

    @PostMapping
    @Operation(summary = "Cria disciplina")
    public ResponseEntity<DisciplinaResponse> create(@Valid @RequestBody DisciplinaRequest request) {
        DisciplinaResponse response = disciplinaService.create(request);
        URI location = ServletUriComponentsBuilder.fromCurrentRequest()
                .path("/{id}")
                .buildAndExpand(response.id())
                .toUri();
        return ResponseEntity.created(location).body(response);
    }

    @GetMapping
    @Operation(summary = "Lista disciplinas")
    public ResponseEntity<List<DisciplinaResponse>> findAll() {
        return ResponseEntity.ok(disciplinaService.findAll());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Consulta disciplina por id")
    public ResponseEntity<DisciplinaResponse> findById(@PathVariable Long id) {
        return ResponseEntity.ok(disciplinaService.findById(id));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Atualiza disciplina")
    public ResponseEntity<DisciplinaResponse> update(@PathVariable Long id, @Valid @RequestBody DisciplinaRequest request) {
        return ResponseEntity.ok(disciplinaService.update(id, request));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Exclui disciplina")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        disciplinaService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
