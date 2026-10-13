// File: src/index.ts
import 'dotenv/config'
import { Hono } from 'hono'
import { serve } from '@hono/node-server'
import { apiReference } from '@scalar/hono-api-reference'
import submissionRoute from './routes/suumission.js' // Correction du nom du fichier
import adminRoute from './routes/admin.js'

const app = new Hono()

app.get('/', (c) => {
  return c.text('API School Admission opérationnelle ! Rendez-vous sur /docs pour tester l’API.')
})

// Montage des routes
app.route('/api/submissions', submissionRoute)
app.route('/api/admin', adminRoute)

// Documentation Scalar complète avec tous les exemples et schémas interactifs
app.get(
  '/docs',
  apiReference({
    spec: {
      content: {
        openapi: '3.0.0',
        info: {
          title: 'API School Admission & Administration',
          version: '1.0.0',
          description: 'Documentation interactive de l’API. Testez la soumission publique et gérez l’administration avec le token JWT.',
        },
        paths: {
          '/api/submissions': {
            post: {
              summary: 'Soumettre une nouvelle fiche d’inscription',
              description: 'Permet à un élève ou parent d’enregistrer une fiche complète (validation Zod active).',
              requestBody: {
                required: true,
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: {
                        classe: { type: 'string', example: '6ème A' },
                        nomEleve: { type: 'string', example: 'Doe' },
                        prenoms: { type: 'string', example: 'John' },
                        sexe: { type: 'string', enum: ['M', 'F'], example: 'M' },
                        age: { type: 'integer', example: 12 },
                        redoublant: { type: 'boolean', example: false },
                        dateNaissance: { type: 'string', format: 'date', example: '2014-05-12' },
                        lieuNaissance: { type: 'string', example: 'Douala' },
                        nationalite: { type: 'string', example: 'Camerounaise' },
                        nomPere: { type: 'string', example: 'Jean Doe' },
                        professionPere: { type: 'string', example: 'Ingénieur' },
                        telephonePere: { type: 'string', example: '699123456' },
                        nomMere: { type: 'string', example: 'Marie Doe' },
                        professionMere: { type: 'string', example: 'Enseignante' },
                        telephoneMere: { type: 'string', example: '677654321' },
                        adresseQuartier: { type: 'string', example: 'Akwa' },
                        nomTuteur: { type: 'string', example: 'Jean Doe' },
                        contactTuteur: { type: 'string', example: '699123456' },
                        personneUrgence: { type: 'string', example: 'Marie Doe' },
                        contactUrgence: { type: 'string', example: '677654321' },
                        observations: { type: 'string', example: 'RAS' },
                        photoUrl: { type: 'string', example: 'https://example.com/photo.jpg' }
                      },
                      required: [
                        'classe', 'nomEleve', 'prenoms', 'sexe', 'age', 
                        'redoublant', 'dateNaissance', 'lieuNaissance', 
                        'nationalite', 'adresseQuartier', 'nomTuteur', 
                        'contactTuteur', 'personneUrgence', 'contactUrgence', 'photoUrl'
                      ]
                    }
                  }
                }
              },
              responses: {
                '201': { description: 'Fiche enregistrée avec succès' },
                '400': { description: 'Données invalides (Erreurs de validation Zod)' }
              }
            }
          },
          '/api/admin/login': {
            post: {
              summary: 'Connexion Administrateur',
              description: 'Échange le mot de passe administrateur contre un token JWT valide 24h.',
              requestBody: {
                required: true,
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: {
                        password: { type: 'string', example: 'MonSuperMotDePasseAdmin123' }
                      },
                      required: ['password']
                    }
                  }
                }
              },
              responses: {
                '200': { description: 'Connexion réussie, retourne le token JWT' },
                '401': { description: 'Mot de passe incorrect' }
              }
            }
          },
          '/api/admin/submissions': {
            get: {
              summary: 'Lister toutes les fiches d’inscription',
              description: 'Récupère la liste de toutes les fiches enregistrées. Nécessite l’authentification Bearer.',
              security: [{ BearerAuth: [] }],
              parameters: [
                {
                  name: 'classe',
                  in: 'query',
                  required: false,
                  description: 'Filtrer les fiches par classe (ex: 6ème A)',
                  schema: { type: 'string' }
                }
              ],
              responses: {
                '200': { description: 'Liste des fiches récupérée avec succès' },
                '401': { description: 'Non autorisé (Token manquant ou invalide)' },
                '403': { description: 'Accès réservé aux administrateurs' }
              }
            }
          },
          '/api/admin/submissions/{id}': {
            delete: {
              summary: 'Supprimer une fiche par ID',
              description: 'Supprime définitivement une fiche de la base de données.',
              security: [{ BearerAuth: [] }],
              parameters: [
                {
                  name: 'id',
                  in: 'path',
                  required: true,
                  description: 'ID unique de la fiche (UUID ou Cuid de Prisma)',
                  schema: { type: 'string' }
                }
              ],
              responses: {
                '200': { description: 'Fiche supprimée avec succès' },
                '401': { description: 'Non autorisé' },
                '404': { description: 'Fiche introuvable' }
              }
            }
          }
        },
        components: {
          securitySchemes: {
            BearerAuth: {
              type: 'http',
              scheme: 'bearer',
              bearerFormat: 'JWT',
            },
          },
        },
      },
    },
  })
)

const port = 3000
console.log(`🚀 Serveur démarré sur http://localhost:${port}`)
console.log(`📖 Documentation Scalar disponible sur http://localhost:${port}/docs`)

serve({ fetch: app.fetch, port })

export default app