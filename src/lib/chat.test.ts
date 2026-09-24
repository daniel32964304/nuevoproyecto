import test from 'node:test';
import assert from 'node:assert/strict';
import { buildResponse } from './chat.ts';

test('buildResponse explains ideas in simple language', () => {
  const response = buildResponse('quiero crear una app para llevar tareas', []);
  assert.match(response, /Te entiendo|paso a paso|Lo haremos paso a paso|sencillo/i);
  assert.doesNotMatch(response, /para llevar tareas para llevar tareas/i);
});

test('buildResponse adds a requested module to the existing structure', () => {
  const response = buildResponse('agrega inicio de sesión', ['quiero crear una app para llevar tareas']);
  assert.match(response, /Agregué/i);
  assert.match(response, /inicio de sesión|Cuentas/i);
  assert.match(response, /Módulos|Datos principales|Flujo principal/i);
});

test('buildResponse removes a requested module from the existing structure', () => {
  const response = buildResponse('quita pagos', ['quiero crear una tienda online con pagos']);
  assert.match(response, /Quité/i);
  assert.doesNotMatch(response, /Pagos y confirmación de operaciones/);
});

test('buildResponse reports analytical gaps in a project structure', () => {
  const response = buildResponse('muéstrame la estructura y el plan completo', ['quiero crear un sistema']);
  assert.match(response, /Completitud estimada:/i);
  assert.match(response, /Prioridad:/i);
  assert.match(response, /Riesgos y decisiones pendientes/i);
});
