// File: src/submission.ts
import { z } from 'zod'

// Fonction utilitaire pour valider un numéro de téléphone (au moins 9 chiffres)
const phoneValidation = z.string().refine((val) => {
  if (!val) return true;
  const digits = val.replace(/\D/g, '');
  return digits.length >= 9;
}, { message: "Le numéro de téléphone doit contenir au moins 9 chiffres." });

// Schéma Zod complet pour la soumission
export const submissionSchema = z.object({
  classe: z.string().min(1, "La classe est requise"),
  nomEleve: z.string().min(1, "Le nom est requis"),
  prenoms: z.string().min(1, "Le prénom est requis"),
  sexe: z.enum(['M', 'F']),
  age: z.number().int().positive("L'âge doit être un nombre positif"),
  redoublant: z.boolean(),
  dateNaissance: z.coerce.date(),
  lieuNaissance: z.string().min(1, "Le lieu de naissance est requis"),
  nationalite: z.string().min(1, "La nationalité est requise"),

  // Parents (Optionnels mais validés si renseignés)
  nomPere: z.string().optional().nullable(),
  professionPere: z.string().optional().nullable(),
  telephonePere: phoneValidation.optional().nullable(),

  nomMere: z.string().optional().nullable(),
  professionMere: z.string().optional().nullable(),
  telephoneMere: phoneValidation.optional().nullable(),

  // Adresse & Tuteur
  adresseQuartier: z.string().min(1, "L'adresse est requise"),
  nomTuteur: z.string().min(1, "Le nom du tuteur est requis"),
  contactTuteur: phoneValidation,

  // Urgence
  personneUrgence: z.string().min(1, "La personne à contacter est requise"),
  contactUrgence: phoneValidation,

  // Divers
  observations: z.string().optional().nullable(),
  photoUrl: z.string().url("URL de photo invalide"),
})
.refine(
  (data) => {
    const hasPere = Boolean(data.nomPere && data.nomPere.trim().length > 0);
    const hasMere = Boolean(data.nomMere && data.nomMere.trim().length > 0);
    return hasPere || hasMere;
  },
  {
    message: "Vous devez renseigner les informations d'au moins un des deux parents (Père ou Mère).",
    path: ["nomPere"],
  }
);