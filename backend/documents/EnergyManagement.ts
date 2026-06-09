/**
 * Système de Gestion de l'Énergie Durable
 * Module de calcul et optimisation énergétique
 */

interface ConsommationMensuelle {
  mois: string;
  chauffage: number;
  electricite: number;
  eauChaude: number;
  temperature: number;
}

interface Statistiques {
  consommationAnnuelle: number;
  consommationMoyenne: number;
  coutAnnuel: number;
  consommationChauffage: number;
  consommationElectricite: number;
  consommationEau: number;
}

interface RecommandationEnergie {
  titre: string;
  description: string;
  economiesPotentielles: number;
  investissement: number;
  retourInvestissement: number;
}

// Données de consommation annuelle
const donneesConsommation: ConsommationMensuelle[] = [
  { mois: 'Janvier', chauffage: 5200, electricite: 3100, eauChaude: 1800, temperature: 8 },
  { mois: 'Février', chauffage: 5100, electricite: 3050, eauChaude: 1750, temperature: 9 },
  { mois: 'Mars', chauffage: 4800, electricite: 2950, eauChaude: 1650, temperature: 10 },
  { mois: 'Avril', chauffage: 3200, electricite: 2800, eauChaude: 1500, temperature: 13 },
  { mois: 'Mai', chauffage: 2100, electricite: 2700, eauChaude: 1400, temperature: 16 },
  { mois: 'Juin', chauffage: 1500, electricite: 3200, eauChaude: 1300, temperature: 19 },
  { mois: 'Juillet', chauffage: 1400, electricite: 3400, eauChaude: 1250, temperature: 21 },
  { mois: 'Août', chauffage: 1600, electricite: 3300, eauChaude: 1280, temperature: 20 },
  { mois: 'Septembre', chauffage: 2400, electricite: 2900, eauChaude: 1380, temperature: 17 },
  { mois: 'Octobre', chauffage: 3800, electricite: 2850, eauChaude: 1480, temperature: 14 },
  { mois: 'Novembre', chauffage: 4600, electricite: 3000, eauChaude: 1650, temperature: 11 },
  { mois: 'Décembre', chauffage: 5400, electricite: 3150, eauChaude: 1850, temperature: 7 }
];

// Tarifs énergétiques (€ par kWh)
const tarifs = {
  chauffage: 0.08,
  electricite: 0.15,
  eauChaude: 0.12
};

/**
 * Calcule les statistiques annuelles de consommation
 */
export function calculerStatistiques(): Statistiques {
  let consommationChauffage = 0;
  let consommationElectricite = 0;
  let consommationEau = 0;
  let coutAnnuel = 0;

  donneesConsommation.forEach(mois => {
    consommationChauffage += mois.chauffage;
    consommationElectricite += mois.electricite;
    consommationEau += mois.eauChaude;
    
    coutAnnuel += 
      (mois.chauffage * tarifs.chauffage) +
      (mois.electricite * tarifs.electricite) +
      (mois.eauChaude * tarifs.eauChaude);
  });

  const consommationAnnuelle = consommationChauffage + consommationElectricite + consommationEau;
  const consommationMoyenne = Math.round(consommationAnnuelle / 12);

  return {
    consommationAnnuelle,
    consommationMoyenne,
    coutAnnuel: Math.round(coutAnnuel * 100) / 100,
    consommationChauffage,
    consommationElectricite,
    consommationEau
  };
}

/**
 * Calcule le pourcentage de chaque source de consommation
 */
export function calculerPourcentages(): { chauffage: number; electricite: number; eau: number } {
  const stats = calculerStatistiques();
  const total = stats.consommationAnnuelle;

  return {
    chauffage: Math.round((stats.consommationChauffage / total) * 1000) / 10,
    electricite: Math.round((stats.consommationElectricite / total) * 1000) / 10,
    eau: Math.round((stats.consommationEau / total) * 1000) / 10
  };
}

/**
 * Calcule l'impact environnemental en tonnes de CO2
 * (0.4 kg CO2 par kWh en moyenne)
 */
export function calculerEmissionsCO2(): number {
  const stats = calculerStatistiques();
  return Math.round((stats.consommationAnnuelle * 0.4) / 1000 * 100) / 100;
}

/**
 * Identifie les mois avec la plus haute consommation
 */
export function identifierPicsConsommation(): ConsommationMensuelle[] {
  return [...donneesConsommation].sort((a, b) => {
    const totalA = a.chauffage + a.electricite + a.eauChaude;
    const totalB = b.chauffage + b.electricite + b.eauChaude;
    return totalB - totalA;
  }).slice(0, 3);
}

/**
 * Génère les recommandations d'économies énergétiques
 */
export function genererRecommandations(): RecommandationEnergie[] {
  return [
    {
      titre: 'Installation de Panneaux Solaires',
      description: 'Réduire la consommation d\'électricité de 40% en moyenne',
      economiesPotentielles: 2164,
      investissement: 8000,
      retourInvestissement: 3.7
    },
    {
      titre: 'Amélioration Isolation Thermique',
      description: 'Réduire la consommation de chauffage de 25%',
      economiesPotentielles: 903,
      investissement: 5000,
      retourInvestissement: 5.5
    },
    {
      titre: 'Pompe à Chaleur pour Eau Chaude',
      description: 'Réduire la consommation d\'eau chaude de 60%',
      economiesPotentielles: 479,
      investissement: 3500,
      retourInvestissement: 7.3
    },
    {
      titre: 'Thermostat Intelligent',
      description: 'Optimiser le chauffage en fonction de l\'occupation',
      economiesPotentielles: 481,
      investissement: 400,
      retourInvestissement: 0.8
    },
    {
      titre: 'LED et Éclairage Efficace',
      description: 'Réduire la consommation d\'électricité de 20% pour l\'éclairage',
      economiesPotentielles: 435,
      investissement: 1200,
      retourInvestissement: 2.8
    }
  ];
}

/**
 * Calcule les économies potentielles totales
 */
export function calculerEconomiesTotales(): number {
  const recommandations = genererRecommandations();
  return recommandations.reduce((total, rec) => total + rec.economiesPotentielles, 0);
}

/**
 * Simule une réduction de consommation (en %)
 */
export function simulerReduction(pourcentage: number): Statistiques {
  const stats = calculerStatistiques();
  const facteur = 1 - (pourcentage / 100);

  return {
    ...stats,
    consommationAnnuelle: Math.round(stats.consommationAnnuelle * facteur),
    consommationMoyenne: Math.round(stats.consommationMoyenne * facteur),
    coutAnnuel: Math.round(stats.coutAnnuel * facteur * 100) / 100,
    consommationChauffage: Math.round(stats.consommationChauffage * facteur),
    consommationElectricite: Math.round(stats.consommationElectricite * facteur),
    consommationEau: Math.round(stats.consommationEau * facteur)
  };
}

/**
 * Classe pour gérer les projets d'efficacité énergétique
 */
export class ProjetEnergie {
  nom: string;
  cout: number;
  economiesAnnuelles: number;
  dureeRetour: number;

  constructor(nom: string, cout: number, economiesAnnuelles: number) {
    this.nom = nom;
    this.cout = cout;
    this.economiesAnnuelles = economiesAnnuelles;
    this.dureeRetour = Math.round((cout / economiesAnnuelles) * 10) / 10;
  }

  obtenirROI(): number {
    return Math.round((this.economiesAnnuelles / this.cout) * 1000) / 10;
  }

  afficherDetails(): string {
    return `
    ${this.nom}
    - Investissement: €${this.cout.toLocaleString()}
    - Économies annuelles: €${this.economiesAnnuelles.toLocaleString()}
    - Durée de retour: ${this.dureeRetour} ans
    - ROI: ${this.obtenirROI()}%
    `;
  }
}

// Exemples d'utilisation
if (require.main === module) {
  console.log('=== GESTION ÉNERGÉTIQUE DURABLE ===\n');
  
  const stats = calculerStatistiques();
  console.log('Statistiques Annuelles:');
  console.log(`- Consommation totale: ${stats.consommationAnnuelle.toLocaleString()} kWh`);
  console.log(`- Consommation moyenne: ${stats.consommationMoyenne.toLocaleString()} kWh/mois`);
  console.log(`- Coût annuel: €${stats.coutAnnuel.toLocaleString()}\n`);
  
  const pourcentages = calculerPourcentages();
  console.log('Répartition de la consommation:');
  console.log(`- Chauffage: ${pourcentages.chauffage}%`);
  console.log(`- Électricité: ${pourcentages.electricite}%`);
  console.log(`- Eau chaude: ${pourcentages.eau}%\n`);
  
  const emissions = calculerEmissionsCO2();
  console.log(`Émissions de CO2: ${emissions} tonnes/an\n`);
  
  const pics = identifierPicsConsommation();
  console.log('Top 3 mois consommation:');
  pics.forEach(m => {
    const total = m.chauffage + m.electricite + m.eauChaude;
    console.log(`- ${m.mois}: ${total.toLocaleString()} kWh`);
  });
  
  const economiesTotales = calculerEconomiesTotales();
  console.log(`\nÉconomies potentielles totales: €${economiesTotales.toLocaleString()}`);
}

export default {
  calculerStatistiques,
  calculerPourcentages,
  calculerEmissionsCO2,
  identifierPicsConsommation,
  genererRecommandations,
  calculerEconomiesTotales,
  simulerReduction,
  ProjetEnergie
};
