import { z } from 'zod';

export const clientSchema = z.object({
    ClientID: z.string(),
    ClientName: z.string(),
    PriorityLevel: z.coerce.number().min(1).max(5),
    RequestedTaskIDs: z.string(),
    GroupTag: z.string(),
    AttributesJSON: z.string().refine((val) => {
        try {
            JSON.parse(val);
            return true;
        } catch {
            return false;
        }
    }, {
        message: "Invalid JSON in AttributesJSON"
    })
});

export const workerSchema = z.object({
    WorkerID: z.string(),
    WorkerName: z.string(),
    Skills: z.string(),
    AvailableSlots: z.string().refine(val => {
        try {
            const arr = JSON.parse(val);
            return Array.isArray(arr) && arr.every(n => Number.isInteger(n));
        } catch {
            return false;
        }
    }, { message: "AvailableSlots must be a JSON array of numbers" }),
    MaxLoadPerPhase: z.coerce.number().min(1),
    WorkerGroup: z.string(),
    QualificationLevel: z.coerce.number().min(1)
});

export const taskSchema = z.object({
    TaskID: z.string(),
    TaskName: z.string(),
    Category: z.string(),
    Duration: z.coerce.number().min(1),
    RequiredSkills: z.string(),
    PreferredPhases: z.string(),
    MaxConcurrent: z.coerce.number().min(1)
});

export interface CoRunRule {
    type: "coRun";
    tasks: string[];
}

export interface LoadLimitRule {
    type: "loadLimit";
    group: string;
    maxSlotsPerPhase: number;
}

export interface PhaseWindowRule {
    type: "phaseWindow";
    task: string;
    allowedPhases: number[];
}

export type Rule = CoRunRule | LoadLimitRule | PhaseWindowRule;