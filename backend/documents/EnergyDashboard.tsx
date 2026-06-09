import React, { useState } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const EnergyDashboard = () => {
  const [chartType, setChartType] = useState<'line' | 'bar'>('line');

  const data = [
    { month: 'Jan', chauffage: 5200, electricite: 3100, eau: 1800 },
    { month: 'Fév', chauffage: 5100, electricite: 3050, eau: 1750 },
    { month: 'Mar', chauffage: 4800, electricite: 2950, eau: 1650 },
    { month: 'Avr', chauffage: 3200, electricite: 2800, eau: 1500 },
    { month: 'Mai', chauffage: 2100, electricite: 2700, eau: 1400 },
    { month: 'Juin', chauffage: 1500, electricite: 3200, eau: 1300 },
    { month: 'Juil', chauffage: 1400, electricite: 3400, eau: 1250 },
    { month: 'Aoû', chauffage: 1600, electricite: 3300, eau: 1280 },
    { month: 'Sep', chauffage: 2400, electricite: 2900, eau: 1380 },
    { month: 'Oct', chauffage: 3800, electricite: 2850, eau: 1480 },
    { month: 'Nov', chauffage: 4600, electricite: 3000, eau: 1650 },
    { month: 'Déc', chauffage: 5400, electricite: 3150, eau: 1850 }
  ];

  const stats = [
    { label: 'Consommation Chauffage', value: '45,200 kWh', color: 'bg-red-500' },
    { label: 'Consommation Électricité', value: '36,100 kWh', color: 'bg-yellow-500' },
    { label: 'Coût Annuel', value: '€13,992', color: 'bg-blue-500' },
    { label: 'Réduction Cible', value: '30%', color: 'bg-green-500' }
  ];

  const totalConsumption = data.reduce((acc, d) => acc + d.chauffage + d.electricite + d.eau, 0);
  const avgMonthly = Math.round(totalConsumption / 12);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Tableau de Bord Énergétique</h1>
          <p className="text-gray-600">Gestion de l'Énergie Durable - Année 2025</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, idx) => (
            <div key={idx} className="bg-white rounded-lg shadow-lg p-6">
              <div className={`${stat.color} w-12 h-12 rounded-full mb-4 opacity-10`}></div>
              <p className="text-gray-600 text-sm font-medium mb-1">{stat.label}</p>
              <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Info Box */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Résumé Annuel</h2>
          <div className="grid grid-cols-3 gap-6">
            <div>
              <p className="text-gray-600 text-sm">Consommation Totale</p>
              <p className="text-3xl font-bold text-blue-600">{totalConsumption.toLocaleString()} kWh</p>
            </div>
            <div>
              <p className="text-gray-600 text-sm">Moyenne Mensuelle</p>
              <p className="text-3xl font-bold text-green-600">{avgMonthly.toLocaleString()} kWh</p>
            </div>
            <div>
              <p className="text-gray-600 text-sm">Consommation Chauffage</p>
              <p className="text-3xl font-bold text-red-600">38.5%</p>
            </div>
          </div>
        </div>

        {/* Chart Toggle */}
        <div className="mb-6 flex gap-4">
          <button
            onClick={() => setChartType('line')}
            className={`px-6 py-2 rounded-lg font-medium transition ${
              chartType === 'line' 
                ? 'bg-indigo-600 text-white' 
                : 'bg-white text-gray-700 border border-gray-300'
            }`}
          >
            Graphique Linéaire
          </button>
          <button
            onClick={() => setChartType('bar')}
            className={`px-6 py-2 rounded-lg font-medium transition ${
              chartType === 'bar' 
                ? 'bg-indigo-600 text-white' 
                : 'bg-white text-gray-700 border border-gray-300'
            }`}
          >
            Diagramme en Barres
          </button>
        </div>

        {/* Chart */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-6">Consommation Mensuelle (kWh)</h2>
          <ResponsiveContainer width="100%" height={400}>
            {chartType === 'line' ? (
              <LineChart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => value.toLocaleString()} />
                <Legend />
                <Line type="monotone" dataKey="chauffage" stroke="#ef4444" name="Chauffage" strokeWidth={2} />
                <Line type="monotone" dataKey="electricite" stroke="#eab308" name="Électricité" strokeWidth={2} />
                <Line type="monotone" dataKey="eau" stroke="#3b82f6" name="Eau Chaude" strokeWidth={2} />
              </LineChart>
            ) : (
              <BarChart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => value.toLocaleString()} />
                <Legend />
                <Bar dataKey="chauffage" fill="#ef4444" name="Chauffage" />
                <Bar dataKey="electricite" fill="#eab308" name="Électricité" />
                <Bar dataKey="eau" fill="#3b82f6" name="Eau Chaude" />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>

        {/* Recommendations */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Recommandations</h2>
          <ul className="space-y-3">
            <li className="flex items-start">
              <span className="text-green-500 mr-3">✓</span>
              <span className="text-gray-700">Installer des panneaux solaires pour réduire la consommation d'électricité d'été</span>
            </li>
            <li className="flex items-start">
              <span className="text-green-500 mr-3">✓</span>
              <span className="text-gray-700">Améliorer l'isolation thermique pour réduire les besoins en chauffage hivernal</span>
            </li>
            <li className="flex items-start">
              <span className="text-green-500 mr-3">✓</span>
              <span className="text-gray-700">Installer une pompe à chaleur pour l'eau chaude sanitaire</span>
            </li>
            <li className="flex items-start">
              <span className="text-green-500 mr-3">✓</span>
              <span className="text-gray-700">Mettre en place des thermostats intelligents</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default EnergyDashboard;
