# Evaluator v1.0.0 - Planes de Mejora

Este directorio contiene los planes de mejora generados por el AI-First Evaluator v1.0.0.

## Estructura de Archivos

```
evaluator-v1.0.0/
├── README.md                              # Este archivo
├── improvements_plan_YYYY-MM-DD.md        # Plan de mejoras específico
└── [futuros planes...]
```

## Convención de Nombres

Los archivos de plan de mejoras siguen el formato:
```
improvements_plan_<fecha>.md
```

Ejemplos:
- `improvements_plan_2026-03-28.md`
- `improvements_plan_2026-04-15.md`
- `improvements_plan_2026-05-01.md`

## Template para Nuevas Evaluaciones

Para crear un nuevo plan de mejoras:

1. **Ejecutar el evaluator:**
   ```bash
   npm run evaluate:quick
   ```

2. **Copiar el template:**
   ```bash
   cp improvements_plan_2026-03-28.md improvements_plan_$(date +%Y-%m-%d).md
   ```

3. **Actualizar campos marcados:**
   - Fecha de evaluación
   - Proyecto evaluado
   - Score obtenido
   - Hallazgos específicos
   - Owners y deadlines

## Contenido del Plan de Mejoras

Cada documento incluye:

1. **Resumen Ejecutivo**
   - Score total y métricas
   - Distribución de puntos por perspectiva
   - Estado general (PASS/FAIL)

2. **Fortalezas**
   - Qué se está haciendo bien
   - Qué mantener

3. **Áreas de Mejora**
   - Priorizadas por impacto
   - Con categorías (IMPLEMENTED, USER_ACTION, etc.)
   - Incluyen templates de solución

4. **Plan de Acción**
   - Tablas con tareas, owners y deadlines
   - Separadas por prioridad

5. **Proyección de Mejora**
   - Score actual vs proyectado
   - ROI estimado

6. **Checklist de Seguimiento**
   - Implementación
   - Verificación
   - Documentación

## Versionado

Cuando se actualice el evaluator a una nueva versión (ej: v1.1.0, v2.0.0):

1. Crear nuevo directorio: `evaluator-v1.1.0/`
2. Copiar template actualizado
3. Documentar cambios en el nuevo formato

## Ejemplo de Uso

```bash
# 1. Evaluar proyecto
npm run evaluate:quick

# 2. Crear plan de mejoras
cp docs/planning/evaluator-v1.0.0/improvements_plan_2026-03-28.md \
   docs/planning/evaluator-v1.0.0/improvements_plan_$(date +%Y-%m-%d).md

# 3. Editar con resultados específicos
# [Abrir en editor y completar]

# 4. Commit
git add docs/planning/evaluator-v1.0.0/
git commit -m "docs: add improvements plan for $(date +%Y-%m-%d)"
```

## Historial

| Fecha | Proyecto | Score | Estado | Archivo |
|-------|----------|-------|--------|---------|
| 2026-03-28 | express-api | 3.88/5.0 | PASS | improvements_plan_2026-03-28.md |

---

**Nota:** Mantener este README actualizado con cada nueva versión del evaluator.
