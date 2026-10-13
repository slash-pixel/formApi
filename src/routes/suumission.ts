// File: src/routes/submission.ts
import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { ZodError } from 'zod'
import { prisma } from '../lib/prisma.js'
import { submissionSchema } from '../submission.js'

const submission = new Hono()

submission.post(
  '/',
  zValidator('json', submissionSchema, (result, c) => {
    if (!result.success) {
      return c.json({
        success: false,
        message: "Les données envoyées sont invalides.",
        erreurs: (result.error as ZodError).flatten().fieldErrors 
      }, 400)
    }
  }),
  async (c) => {
    const validData = c.req.valid('json')

    try {
      const newSubmission = await prisma.submission.create({
        data: validData
      })

      return c.json({
        success: true,
        message: "Fiche de renseignement enregistrée avec succès",
        data: newSubmission
      }, 201)

    } catch (error) {
      console.error(error)
      return c.json({ 
        success: false, 
        message: "Erreur lors de l'enregistrement dans la base de données" 
      }, 500)
    }
  }
)

export default submission