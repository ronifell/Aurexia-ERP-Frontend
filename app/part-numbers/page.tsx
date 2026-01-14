'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { partNumbersAPI } from '@/lib/api';
import { PartNumber } from '@/lib/types';
import { Plus, Search, Eye } from 'lucide-react';
import toast from 'react-hot-toast';

const PartNumbersPage = () => {
  const router = useRouter();
  const [partNumbers, setPartNumbers] = useState<PartNumber[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      router.push('/login');
      return;
    }
    loadPartNumbers();
  }, [router]);

  const loadPartNumbers = async () => {
    try {
      const data = await partNumbersAPI.getAll();
      setPartNumbers(data);
    } catch (error) {
      toast.error('Failed to load part numbers');
    } finally {
      setLoading(false);
    }
  };

  const filteredPartNumbers = partNumbers.filter(pn =>
    pn.part_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pn.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pn.customer?.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold gold-text mb-2">Part Numbers</h1>
            <p className="text-gray-400">Product catalog and routing definitions</p>
          </div>
          <button className="btn-aurexia flex items-center space-x-2">
            <Plus className="w-5 h-5" />
            <span>New Part Number</span>
          </button>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="text"
              placeholder="Search by part number, description, or customer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-black/20 backdrop-blur-sm border border-yellow-500/30 rounded-lg focus:outline-none focus:border-yellow-500 text-gray-100"
            />
          </div>
        </div>

        {/* Part Numbers Table */}
        <div className="card-aurexia p-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-yellow-500/20">
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Part Number</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Description</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Customer</th>
                  <th className="text-center py-3 px-4 text-gray-400 font-medium">Material</th>
                  <th className="text-center py-3 px-4 text-gray-400 font-medium">Processes</th>
                  <th className="text-center py-3 px-4 text-gray-400 font-medium">Active</th>
                  <th className="text-center py-3 px-4 text-gray-400 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPartNumbers.map((pn) => (
                  <tr key={pn.id} className="border-b border-gray-800 hover:bg-yellow-500/5">
                    <td className="py-3 px-4 text-gray-200 font-medium">{pn.part_number}</td>
                    <td className="py-3 px-4 text-gray-300">{pn.description || '-'}</td>
                    <td className="py-3 px-4 text-gray-300">{pn.customer?.name || '-'}</td>
                    <td className="py-3 px-4 text-center text-gray-300">{pn.material_type || '-'}</td>
                    <td className="py-3 px-4 text-center text-gray-200">
                      {pn.routings?.length || 0}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex justify-center">
                        <span className={`w-3 h-3 rounded-full ${pn.is_active ? 'bg-green-400' : 'bg-red-400'}`}></span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex justify-center space-x-2">
                        <button className="p-2 hover:bg-yellow-500/10 rounded-lg text-gray-400 hover:text-yellow-400">
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredPartNumbers.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <p>No part numbers found</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PartNumbersPage;
