import axios from 'axios';
import React, { useMemo, useState } from 'react';
import { useGlobalSkills } from '../../../context/skillContext';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css'; 

const AdminBlogPost = () => {




    const quillModules = {
        toolbar: [
            [{ header: [1, 2, 3, false] }],
            ['bold', 'italic', 'underline', 'strike'],
            [{ list: 'ordered' }, { list: 'bullet' }],
            ['link'],
            [{ align: [] }],
            ['clean'],
        ],
    };

    const quillFormats = [
        'header', 'bold', 'italic', 'underline', 'strike',
        'list', 'bullet', 'link', 'align'
    ];

    return (
        <ReactQuill
            theme="snow"
            value={entry.description}
            onChange={(value) => {
                const newEntries = [...entries];
                newEntries[index].description = value;
                setEntries(newEntries);
            }}
            modules={quillModules}
            formats={quillFormats}
        />
    );
};

export default AdminBlogPost;
