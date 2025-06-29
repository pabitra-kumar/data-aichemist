import { clientSchema, workerSchema, taskSchema } from './validations';

import { ZodObject, ZodRawShape } from 'zod';

export function getSchema(sheetName: string): ZodObject<ZodRawShape> | null {
    const lower = sheetName.toLowerCase();
    if (lower.includes('client')) return clientSchema;
    if (lower.includes('worker')) return workerSchema;
    if (lower.includes('task')) return taskSchema;
    return null;
}

function getRequiredFields(schema: ZodObject<ZodRawShape>): string[] {
    return Object.keys(schema.shape);
}


export function validateSheetData(sheetName: string, data: any[]) {
    const schema = getSchema(sheetName);
    if (!schema) return { errorMap: {} };

    const requiredFields = getRequiredFields(schema);
    const errorMap: Record<string, boolean> = {};
    const seenIds = new Set();
    const idField = requiredFields.find(f => f.toLowerCase().includes('id'));

    data.forEach((row, rowIndex) => {
        // Schema validation
        const result = schema.safeParse(row);
        if (!result.success) {
            for (const issue of result.error.errors) {
                const key = `${rowIndex}-${issue.path[0]}`;
                errorMap[key] = true;
            }
        }

        // Required field check
        for (const field of requiredFields) {
            if (row[field] === undefined || row[field] === '') {
                const key = `${rowIndex}-${field}`;
                errorMap[key] = true;
            }
        }

        // Duplicate ID check
        if (idField && row[idField]) {
            const id = row[idField];
            if (seenIds.has(id)) {
                const key = `${rowIndex}-${idField}`;
                errorMap[key] = true;
            }
            seenIds.add(id);
        }
    });

    return { errorMap };
}
