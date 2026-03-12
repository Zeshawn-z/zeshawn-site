import fs from "fs";
import path from "path";
import { Project, Experience, SkillGroup } from "./types";

const dataDir = path.join(process.cwd(), "data");

function readJsonFile<T>(filename: string): T[] {
  const filePath = path.join(dataDir, filename);
  if (!fs.existsSync(filePath)) return [];
  const raw = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(raw) as T[];
}

function writeJsonFile<T>(filename: string, data: T[]) {
  const filePath = path.join(dataDir, filename);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
}

// Projects
export function getProjects(): Project[] {
  return readJsonFile<Project>("projects.json").sort(
    (a, b) => (a.order ?? 999) - (b.order ?? 999)
  );
}

export function saveProjects(projects: Project[]) {
  writeJsonFile("projects.json", projects);
}

// Experiences
export function getExperiences(): Experience[] {
  return readJsonFile<Experience>("experiences.json").sort(
    (a, b) => (a.order ?? 999) - (b.order ?? 999)
  );
}

export function saveExperiences(experiences: Experience[]) {
  writeJsonFile("experiences.json", experiences);
}

// Skills
export function getSkills(): SkillGroup[] {
  return readJsonFile<SkillGroup>("skills.json").sort(
    (a, b) => (a.order ?? 999) - (b.order ?? 999)
  );
}

export function saveSkills(skills: SkillGroup[]) {
  writeJsonFile("skills.json", skills);
}
