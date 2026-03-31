// src/routes/templates.js — Workspace template CRUD
// Templates store layout structure (splits, sizes) without session assignments.
// When creating a workspace from a template, sessions are auto-assigned from available sessions.

export default async function templateRoutes(fastify) {
  const db = fastify.db;

  // List all templates
  fastify.get('/api/templates', async () => {
    const rows = db.prepare('SELECT * FROM workspace_templates ORDER BY sort_order, id').all();
    return {
      templates: rows.map(r => ({
        id: r.id,
        name: r.name,
        description: r.description,
        layout: JSON.parse(r.layout_json),
        paneCount: r.pane_count,
        createdAt: r.created_at,
      })),
    };
  });

  // Create a template (typically from "Save as Template" on an existing workspace)
  fastify.post('/api/templates', async (request, reply) => {
    const { name, description, layout } = request.body || {};
    if (!name?.trim()) return reply.code(400).send({ error: 'Name is required' });
    if (!layout) return reply.code(400).send({ error: 'Layout is required' });

    // Strip session-specific data, keep only structure
    const templateLayout = stripSessions(layout);
    const paneCount = countPanes(templateLayout);

    try {
      const result = db.prepare(
        'INSERT INTO workspace_templates (name, description, layout_json, pane_count) VALUES (?, ?, ?, ?)'
      ).run(name.trim(), description || '', JSON.stringify(templateLayout), paneCount);

      fastify.log.info({ id: result.lastInsertRowid, name: name.trim(), paneCount }, 'Template created');
      return reply.code(201).send({
        id: result.lastInsertRowid,
        name: name.trim(),
        description: description || '',
        layout: templateLayout,
        paneCount,
      });
    } catch (err) {
      if (err.message.includes('UNIQUE')) {
        return reply.code(409).send({ error: `Template "${name.trim()}" already exists` });
      }
      throw err;
    }
  });

  // Rename a template
  fastify.put('/api/templates/:id', async (request, reply) => {
    const { name, description } = request.body || {};
    const row = db.prepare('SELECT * FROM workspace_templates WHERE id = ?').get(request.params.id);
    if (!row) return reply.code(404).send({ error: 'Template not found' });

    const updates = [];
    const params = [];
    if (name) { updates.push('name = ?'); params.push(name.trim()); }
    if (description !== undefined) { updates.push('description = ?'); params.push(description); }
    if (!updates.length) return reply.code(400).send({ error: 'Nothing to update' });
    params.push(request.params.id);

    try {
      db.prepare(`UPDATE workspace_templates SET ${updates.join(', ')} WHERE id = ?`).run(...params);
      return { success: true };
    } catch (err) {
      if (err.message.includes('UNIQUE')) {
        return reply.code(409).send({ error: `Template "${name}" already exists` });
      }
      throw err;
    }
  });

  // Delete a template
  fastify.delete('/api/templates/:id', async (request, reply) => {
    const row = db.prepare('SELECT * FROM workspace_templates WHERE id = ?').get(request.params.id);
    if (!row) return reply.code(404).send({ error: 'Template not found' });

    db.prepare('DELETE FROM workspace_templates WHERE id = ?').run(request.params.id);
    fastify.log.info({ id: request.params.id, name: row.name }, 'Template deleted');
    return { success: true, name: row.name };
  });
}

/**
 * Strip session-specific data from a layout tree.
 * Preserves: split direction, sizes, children structure.
 * Replaces session names with numbered placeholders.
 */
function stripSessions(node, counter = { n: 0 }) {
  if (node.session) {
    counter.n++;
    return {
      session: `pane-${counter.n}`,
      host: 'reliant',
      ...(node.size ? { size: node.size } : {}),
    };
  }
  if (node.children) {
    return {
      direction: node.direction,
      ...(node.size ? { size: node.size } : {}),
      children: node.children.map(c => stripSessions(c, counter)),
    };
  }
  return node;
}

function countPanes(node) {
  if (node.session) return 1;
  if (node.children) return node.children.reduce((sum, c) => sum + countPanes(c), 0);
  return 0;
}
