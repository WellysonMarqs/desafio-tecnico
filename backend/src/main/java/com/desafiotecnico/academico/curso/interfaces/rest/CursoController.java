package com.desafiotecnico.academico.curso.interfaces.rest;

import com.desafiotecnico.academico.curso.application.dto.CursoRequest;
import com.desafiotecnico.academico.curso.application.dto.CursoResponse;
import com.desafiotecnico.academico.curso.application.service.CursoService;
import io.swagger.v3.oas.annotations.Operation;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/api/cursos")
public class CursoController {

    private final CursoService cursoService;

    public CursoController(CursoService cursoService) {
        this.cursoService = cursoService;
    }

    @PostMapping
    @Operation(summary = "Cria curso")
    public ResponseEntity<CursoResponse> create(@Valid @RequestBody CursoRequest request) {
        CursoResponse response = cursoService.create(request);
        URI location = ServletUriComponentsBuilder.fromCurrentRequest()
                .path("/{id}")
                .buildAndExpand(response.id())
                .toUri();
        return ResponseEntity.created(location).body(response);
    }

    @GetMapping
    @Operation(summary = "Lista cursos")
    public ResponseEntity<List<CursoResponse>> findAll() {
        return ResponseEntity.ok(cursoService.findAll());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Consulta curso por id")
    public ResponseEntity<CursoResponse> findById(@PathVariable Long id) {
        return ResponseEntity.ok(cursoService.findById(id));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Atualiza curso")
    public ResponseEntity<CursoResponse> update(@PathVariable Long id, @Valid @RequestBody CursoRequest request) {
        return ResponseEntity.ok(cursoService.update(id, request));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Exclui curso")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        cursoService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
