'use client';
// import useDropDownDataStore from '@/store/dropDownDataStore';
import useDropDownDataStore from '../store/dropDownDataStore';
import { useState, useEffect } from 'react';
import Select from 'react-select';

function RestOfPostEdit({ formData, handleChange}) {
  const { allTags, allCategory, allRoleBaseUser, fetchDropDownData } = useDropDownDataStore();
  
  useEffect(() => {
    // Fetch the dropdown data for categories, tags, and credits
    fetchDropDownData(`${process.env.NEXT_PUBLIC_API_URL}/category`, 'category');
    fetchDropDownData(`${process.env.NEXT_PUBLIC_API_URL}/tag`, 'tag');
    fetchDropDownData(`${process.env.NEXT_PUBLIC_API_URL}/user`, 'roleBaseUser');
  }, [fetchDropDownData]);

  // Options for dropdowns
  const categoryOptions = allCategory.map((cat) => ({
    value: cat._id,
    label: cat.name?.replace(/Ã—/g, "").replace(/×/g, "").trim(),
  }));

  const tagOptions = allTags.map((tag) => ({
    value: tag._id,
    label: tag.name?.replace(/Ã—/g, "").replace(/×/g, "").trim(),
  }));

  const creditOptions = allRoleBaseUser.map((role) => ({
    value: role._id,
    label: role.name,
  }));

  // Handle changes for all form fields
  const handleChangeFromData = (value, field) => {
    handleChange(value, field)
  };

  return (
    <div className="w-full rounded-xl border border-gray-100 bg-white shadow-sm">
      <div className="p-6 border-b border-gray-100">
        <h2 className="text-xl font-semibold text-gray-800">Post Properties</h2>
      </div>
      
      <div className="p-6 space-y-6">
        <div className="space-y-2 w-full">
          <label className="block text-sm font-medium text-gray-700">
            Primary Category <span className="text-red-500">*</span>
          </label>
          <Select
            value={formData.primaryCategory}
            onChange={(value) => handleChangeFromData(value, 'primaryCategory')}
            options={categoryOptions}
            className="basic-single w-full"
            classNamePrefix="select"
            isClearable
            placeholder="Select Primary Category"
            styles={{
              control: (base) => ({
                ...base,
                width: '100%',
                padding: '2px',
                borderColor: '#e5e7eb',
                '&:hover': {
                  borderColor: '#3b82f6'
                }
              }),
              placeholder: (base) => ({
                ...base,
                color: '#9ca3af'
              })
            }}
          />
        </div>

        <div className="space-y-2 w-full">
          <label className="block text-sm font-medium text-gray-700">
            Additional Categories
          </label>
          <Select
            isMulti
            value={formData.additionalCategories}
            onChange={(value) => handleChangeFromData(value, 'additionalCategories')}
            options={categoryOptions}
            className="basic-multi-select w-full"
            classNamePrefix="select"
            placeholder="Select Additional Categories"
            styles={{
              control: (base) => ({
                ...base,
                width: '100%',
                padding: '2px',
                borderColor: '#e5e7eb',
                '&:hover': {
                  borderColor: '#3b82f6'
                }
              }),
              multiValue: (base) => ({
                ...base,
                backgroundColor: '#f3f4f6',
                borderRadius: '4px'
              }),
              placeholder: (base) => ({
                ...base,
                color: '#9ca3af'
              })
            }}
          />
        </div>

        <div className="space-y-2 w-full">
          <label className="block text-sm font-medium text-gray-700">
            Tags
          </label>
          <Select
            isMulti
            value={formData.tags}
            onChange={(value) => handleChangeFromData(value, 'tags')}
            options={tagOptions}
            className="basic-multi-select w-full"
            classNamePrefix="select"
            placeholder="Select Tags"
            styles={{
              control: (base) => ({
                ...base,
                width: '100%',
                padding: '2px',
                borderColor: '#e5e7eb',
                '&:hover': {
                  borderColor: '#3b82f6'
                }
              }),
              multiValue: (base) => ({
                ...base,
                backgroundColor: '#f3f4f6',
                borderRadius: '4px'
              }),
              placeholder: (base) => ({
                ...base,
                color: '#9ca3af'
              })
            }}
          />
        </div>

        <div className="space-y-2 w-full">
          <label className="block text-sm font-medium text-gray-700">
            Credits <span className="text-red-500">*</span>
          </label>
          <Select
            isMulti
            value={formData.credits}
            onChange={(value) => handleChangeFromData(value, 'credits')}
            options={creditOptions}
            className="basic-multi-select w-full"
            classNamePrefix="select"
            placeholder="Select Credits"
            styles={{
              control: (base) => ({
                ...base,
                width: '100%',
                padding: '2px',
                borderColor: '#e5e7eb',
                '&:hover': {
                  borderColor: '#3b82f6'
                }
              }),
              multiValue: (base) => ({
                ...base,
                backgroundColor: '#f3f4f6',
                borderRadius: '4px'
              }),
              placeholder: (base) => ({
                ...base,
                color: '#9ca3af'
              })
            }}
          />
        </div>

        <div className="space-y-2 w-full">
          <label className="block text-sm font-medium text-gray-700">
            Focus Keyphrase
          </label>
          <input
            type="text"
            value={formData.focusKeyphrase}
            onChange={(e) => handleChangeFromData(e.target.value, 'focusKeyphrase')}
            className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-150"
            placeholder="Enter focus keyphrase"
          />
        </div>
      </div>
    </div>
  );
}

export default RestOfPostEdit;