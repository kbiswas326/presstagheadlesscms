# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Enhanced TinyMCE editor with improved image handling
  - Added image caption functionality
  - Restored advanced image settings
  - Added image class options for responsiveness
  - Enhanced alt text preservation
- Implemented profile update functionality in ProfileModal
  - Added image upload with preview and size validation
  - Added form data initialization with user data
  - Implemented profile update API integration
  - Added loading states and error handling
  - Added success/error notifications
- Enhanced login page UI with modern design
  - Added gradient backgrounds and animations
  - Improved form layout and styling
  - Added better error message presentation
  - Enhanced responsive design

### Changed
- Improved Media Gallery UI/UX
  - Made alt text mandatory for all image uploads
  - Added image preview before upload
  - Implemented compact upload modal
  - Added close button to full view modal
  - Added click-outside-to-close functionality
  - Enhanced responsive layout
  - Reduced unnecessary padding
  - Improved button styling
  - Enhanced error message display
  - Implemented fixed-height image previews

### Fixed
- Alt text preservation across image uploads
- Image caption display in TinyMCE editor
- Modal closing behavior
- Responsive layout issues in media gallery

### Security
- Improved validation for image uploads
- Enhanced error handling for alt text submissions
