import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FaTrophy,
    FaPlus,
    FaEdit,
    FaTrash,
    FaTimes,
    FaCheck,
    FaCog,
    FaUser,
    FaEye,
} from 'react-icons/fa';
import ConfirmationDialog from '../../../components/common/ConfirmationDialog';
import CustomCriteriaBuilder from '../../../components/admin/CustomCriteriaBuilder';
import TrophyPreviewModal from '../../../components/admin/TrophyPreviewModal';
import {
    Trophy,
    User,
    TrophyCriteria,
    CriteriaType,
    TrophyAssignmentResult,
    CustomCriteriaValidationResult,
    TrophyPreviewResult,
    AllTrophyPreviewResult
} from '../../../types/adminTypes';
import {
    getTrophyCriteria,
    createTrophyCriteria,
    updateTrophyCriteria,
    deleteTrophyCriteria,
    getCriteriaTypes,
    assignTrophies,
    previewTrophyWinners,
    previewAllTrophyWinners
} from '../../../services/adminService';
import * as adminService from '../../../services/adminService';
import { useNotification } from '../../../context/AlertContext';
import { getCurrentSeason } from '../../../utils/seasonHelpers';

interface TrophyManagementProps {
    users: User[];
    onRefreshUsers: () => void;
}

type TabType = 'manual' | 'criteria';

// Trophy Criteria Modal Component
interface TrophyCriteriaModalProps {
    isOpen: boolean;
    onClose: () => void;
    criteria?: TrophyCriteria | null;
    criteriaTypes: CriteriaType[];
    onSave: () => void;
}

const TrophyCriteriaModal: React.FC<TrophyCriteriaModalProps> = ({
    isOpen,
    onClose,
    criteria,
    criteriaTypes,
    onSave
}) => {
    const [formData, setFormData] = useState<Partial<TrophyCriteria>>({
        name: '',
        description: '',
        criteriaType: '',
        customCriteria: undefined,
        isActive: true,
        season: getCurrentSeason().season,
        year: new Date().getFullYear(),
        awardLimit: 1,
        minValue: 1,
        priority: 0
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [validationResult, setValidationResult] = useState<CustomCriteriaValidationResult | null>(null);
    const { showSuccess, showError } = useNotification();

    useEffect(() => {
        if (criteria) {
            setFormData(criteria);
        } else {
            setFormData({
                name: '',
                description: '',
                criteriaType: '',
                customCriteria: undefined,
                isActive: true,
                season: getCurrentSeason().season,
                year: new Date().getFullYear(),
                awardLimit: 1,
                minValue: 1,
                priority: 0
            });
        }
    }, [criteria, isOpen]);
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validate custom criteria if it's a custom type
        if (formData.criteriaType === 'custom' && !validationResult?.valid) {
            showError('Please validate your custom criteria before saving');
            return;
        }

        setIsSubmitting(true);

        try {      // Clean up the form data - remove empty strings and replace with undefined
            const cleanedData = {
                ...formData,
                season: formData.season && formData.season.trim() !== '' ? formData.season : undefined,
                year: formData.year || undefined,
            };

            // Only include customCriteria if it's a custom type and has a value
            if (formData.criteriaType === 'custom' && formData.customCriteria) {
                cleanedData.customCriteria = formData.customCriteria;
            }

            if (criteria?._id) {
                await updateTrophyCriteria(criteria._id, cleanedData);
                showSuccess('Trophy criteria updated successfully');
            } else {
                await createTrophyCriteria(cleanedData);
                showSuccess('Trophy criteria created successfully');
            } onSave();
            onClose();
        } catch (error: any) {
            // Show detailed error message if available
            const errorMessage = error.response?.data?.message || error.message || 'An error occurred';
            showError(errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    const selectedCriteriaType = criteriaTypes.find(ct => ct.value === formData.criteriaType);
    const isCustomType = formData.criteriaType === 'custom';

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-neutral-800 rounded-lg p-6 w-full max-w-md max-h-screen overflow-y-auto">
                <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
                    {criteria ? 'Edit Trophy Criteria' : 'Create Trophy Criteria'}
                </h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Name
                        </label>
                        <input
                            type="text"
                            value={formData.name || ''}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-neutral-700 text-gray-900 dark:text-white"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Description
                        </label>
                        <textarea
                            value={formData.description || ''}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-neutral-700 text-gray-900 dark:text-white"
                            rows={3}
                            required
                        />
                    </div>          <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Criteria Type
                        </label>
                        <select
                            value={formData.criteriaType || ''}
                            onChange={(e) => setFormData({ ...formData, criteriaType: e.target.value })}
                            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-neutral-700 text-gray-900 dark:text-white"
                            required
                        >
                            <option value="">Select criteria type</option>
                            {criteriaTypes.map(ct => (
                                <option key={ct.value} value={ct.value}>
                                    {ct.label}
                                </option>
                            ))}
                        </select>
                        {selectedCriteriaType && (
                            <p className="text-xs text-gray-500 mt-1">{selectedCriteriaType.description}</p>
                        )}
                    </div>

                    {/* Custom Criteria Builder */}
                    {isCustomType && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Custom Criteria Configuration
                            </label>
                            <div className="border border-gray-300 dark:border-gray-600 rounded-md p-4 bg-gray-50 dark:bg-neutral-800">
                                <CustomCriteriaBuilder
                                    value={formData.customCriteria || null}
                                    onChange={(criteria) => setFormData({ ...formData, customCriteria: criteria || undefined })}
                                    season={formData.season}
                                    year={formData.year}
                                    onValidationResult={setValidationResult}
                                />
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Award Limit
                            </label>
                            <input
                                type="number"
                                value={formData.awardLimit || 1}
                                onChange={(e) => setFormData({ ...formData, awardLimit: parseInt(e.target.value) || 1 })}
                                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-neutral-700 text-gray-900 dark:text-white"
                                min="1"
                                required
                            />
                            <p className="text-xs text-gray-500 mt-1">Maximum number of users who can receive this trophy</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Minimum Value
                            </label>
                            <input
                                type="number"
                                value={formData.minValue || 0}
                                onChange={(e) => setFormData({ ...formData, minValue: parseInt(e.target.value) || 0 })}
                                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-neutral-700 text-gray-900 dark:text-white"
                                min="0"
                            />
                            <p className="text-xs text-gray-500 mt-1">Minimum value required to be eligible</p>
                        </div>
                    </div>          <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Season (optional)
                            </label>
                            <select
                                value={formData.season || ''}
                                onChange={(e) => setFormData({ ...formData, season: e.target.value || undefined })}
                                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-neutral-700 text-gray-900 dark:text-white"
                            >
                                <option value="">Any season</option>
                                <option value="Winter">Winter</option>
                                <option value="Spring">Spring</option>
                                <option value="Summer">Summer</option>
                                <option value="Fall">Fall</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Year (optional)
                            </label>
                            <input
                                type="number"
                                value={formData.year || ''}
                                onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) || undefined })}
                                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-neutral-700 text-gray-900 dark:text-white"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Priority
                            </label>
                            <input
                                type="number"
                                value={formData.priority || 0}
                                onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 0 })}
                                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-neutral-700 text-gray-900 dark:text-white"
                            />
                            <p className="text-xs text-gray-500 mt-1">Higher priority criteria are processed first</p>
                        </div>
                    </div>

                    <div className="flex items-center">
                        <input
                            type="checkbox"
                            id="isActive"
                            checked={formData.isActive || false}
                            onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                            className="mr-2"
                        />
                        <label htmlFor="isActive" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Active
                        </label>
                    </div>

                    {/* Custom Criteria Validation Status */}
                    {isCustomType && validationResult && (
                        <div className={`p-3 rounded-md ${validationResult.valid ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                            }`}>
                            <div className="flex items-center space-x-2">
                                {validationResult.valid ? (
                                    <FaCheck className="text-green-600" />
                                ) : (
                                    <FaTimes className="text-red-600" />
                                )}
                                <span className={`text-sm font-medium ${validationResult.valid ? 'text-green-800' : 'text-red-800'
                                    }`}>
                                    {validationResult.valid ? 'Custom criteria validated' : 'Custom criteria validation failed'}
                                </span>
                            </div>
                            {validationResult.message && (
                                <p className={`text-sm mt-1 ${validationResult.valid ? 'text-green-700' : 'text-red-700'
                                    }`}>
                                    {validationResult.message}
                                </p>
                            )}
                        </div>
                    )}

                    <div className="flex justify-end space-x-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-neutral-700"
                        >
                            Cancel
                        </button>            <button
                            type="submit"
                            disabled={isSubmitting || (isCustomType && !validationResult?.valid)}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? 'Saving...' : (criteria ? 'Update' : 'Create')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// Main Trophy Management Component
const TrophyManagement: React.FC<TrophyManagementProps> = ({ users, onRefreshUsers }) => {
    const [activeTab, setActiveTab] = useState<TabType>('manual');

    // Manual trophy state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [selectedTrophy, setSelectedTrophy] = useState<Trophy | null>(null);
    const [formData, setFormData] = useState({
        trophyName: '',
        description: '',
        season: getCurrentSeason().season,
        year: new Date().getFullYear(),
    });
    const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);
    const [trophyToDelete, setTrophyToDelete] = useState<{ userId: string; trophyId: string } | null>(null);
    // Criteria management state
    const [criteria, setCriteria] = useState<TrophyCriteria[]>([]);
    const [criteriaTypes, setCriteriaTypes] = useState<CriteriaType[]>([]);
    const [isCriteriaModalOpen, setIsCriteriaModalOpen] = useState(false);
    const [editingCriteria, setEditingCriteria] = useState<TrophyCriteria | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [assignmentForm, setAssignmentForm] = useState({ season: getCurrentSeason().season, year: new Date().getFullYear() });
    const [isAssigning, setIsAssigning] = useState(false);

    // Preview state
    const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
    const [previewData, setPreviewData] = useState<TrophyPreviewResult | AllTrophyPreviewResult | null>(null);
    const [isLoadingPreview, setIsLoadingPreview] = useState(false);
    const [previewTitle, setPreviewTitle] = useState('');

    const { showSuccess, showError } = useNotification();

    const seasons = ['Spring', 'Summer', 'Fall', 'Winter'];
    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 10 }, (_, i) => currentYear - i);

    // Filter users to show clipteam members who have trophies
    const clipteamUsersWithTrophies = users.filter(user =>
        user.roles.includes('clipteam') && user.profile && user.profile.trophies && user.profile.trophies.length > 0
    );

    // All clipteam users for dropdown selection
    const clipteamUsers = users.filter(user =>
        user.roles.includes('clipteam')
    );

    useEffect(() => {
        if (activeTab === 'criteria') {
            loadCriteriaData();
        }
    }, [activeTab]);

    const loadCriteriaData = async () => {
        try {
            setIsLoading(true);
            const [criteriaData, typesData] = await Promise.all([
                getTrophyCriteria(),
                getCriteriaTypes()
            ]);
            setCriteria(criteriaData);
            setCriteriaTypes(typesData);
        } catch (error: any) {
            showError(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    // Manual trophy methods (from original component)
    const handleOpenModal = (user?: User, trophy?: Trophy) => {
        if (user && trophy) {
            setEditMode(true);
            setSelectedUser(user);
            setSelectedTrophy(trophy);
            setFormData({
                trophyName: trophy.trophyName,
                description: trophy.description,
                season: getCurrentSeason().season,
                year: new Date().getFullYear(),
            });
        } else if (user) {
            setEditMode(false);
            setSelectedUser(user);
            setSelectedTrophy(null);
            setFormData({
                trophyName: '',
                description: '',
                season: getCurrentSeason().season,
                year: new Date().getFullYear(),
            });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditMode(false);
        setSelectedUser(null);
        setSelectedTrophy(null);
        setFormData({
            trophyName: '',
            description: '',
            season: getCurrentSeason().season,
            year: new Date().getFullYear(),
        });
        setAlert(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedUser) return;

        try {
            if (editMode && selectedTrophy) {        // Update existing trophy
                await adminService.addOrUpdateTrophy(selectedUser._id, {
                    trophyName: formData.trophyName,
                    description: formData.description,
                    season: formData.season,
                    year: formData.year,
                }, selectedTrophy._id);
                setAlert({ type: 'success', message: 'Trophy updated successfully!' });
            } else {        // Add new trophy
                await adminService.addOrUpdateTrophy(selectedUser._id, {
                    trophyName: formData.trophyName,
                    description: formData.description,
                    season: formData.season,
                    year: formData.year,
                });
                setAlert({ type: 'success', message: 'Trophy added successfully!' });
            }

            onRefreshUsers();
            setTimeout(() => {
                handleCloseModal();
            }, 1500);
        } catch (error: any) {
            setAlert({ type: 'error', message: error.message || 'Failed to save trophy' });
        }
    };

    const handleDeleteTrophy = async () => {
        if (!trophyToDelete) return;

        try {
            await adminService.deleteTrophy(trophyToDelete.userId, trophyToDelete.trophyId);
            setAlert({ type: 'success', message: 'Trophy deleted successfully!' });
            onRefreshUsers();
            setShowDeleteConfirm(false);
            setTrophyToDelete(null);
        } catch (error: any) {
            setAlert({ type: 'error', message: error.message || 'Failed to delete trophy' });
        }
    };

    // Criteria management methods
    const handleEditCriteria = (criteria: TrophyCriteria) => {
        setEditingCriteria(criteria);
        setIsCriteriaModalOpen(true);
    };

    const handleDeleteCriteria = async (id: string) => {
        if (!confirm('Are you sure you want to delete this trophy criteria?')) return;

        try {
            await deleteTrophyCriteria(id);
            showSuccess('Trophy criteria deleted successfully');
            loadCriteriaData();
        } catch (error: any) {
            showError(error.message);
        }
    };

    const handleAssignTrophies = async () => {
        if (!assignmentForm.season || !assignmentForm.year) {
            showError('Please select both season and year');
            return;
        }

        if (!confirm(`Are you sure you want to assign trophies for ${assignmentForm.season} ${assignmentForm.year}?`)) {
            return;
        }

        try {
            setIsAssigning(true);
            const result: TrophyAssignmentResult = await assignTrophies(assignmentForm.season, assignmentForm.year);

            showSuccess(`Successfully awarded ${result.trophiesAwarded} trophies!`);
            onRefreshUsers(); // Refresh users to show new trophies

            // Show details if available
            if (result.details && result.details.length > 0) {
                console.log('Trophy assignment details:', result.details);
            }
        } catch (error: any) {
            showError(error.message);
        } finally {
            setIsAssigning(false);
        }
    };

    const closeCriteriaModal = () => {
        setIsCriteriaModalOpen(false);
        setEditingCriteria(null);
    };
    // Preview functions
    const handlePreviewCriteria = async (criteriaItem: TrophyCriteria) => {
        if (!criteriaItem._id || !criteriaItem.season || !criteriaItem.year) {
            showError('Criteria is missing required information for preview');
            return;
        }

        setIsLoadingPreview(true);
        setPreviewTitle(`Preview: ${criteriaItem.name}`);
        setIsPreviewModalOpen(true);

        try {
            const result = await previewTrophyWinners(criteriaItem._id, criteriaItem.season, criteriaItem.year);
            setPreviewData(result);
        } catch (error: any) {
            showError(error.message);
            setPreviewData(null);
        } finally {
            setIsLoadingPreview(false);
        }
    };

    const handlePreviewAllTrophies = async () => {
        if (!assignmentForm.season || !assignmentForm.year) {
            showError('Please select both season and year');
            return;
        }

        setIsLoadingPreview(true);
        setPreviewTitle(`Preview All Trophies: ${assignmentForm.season} ${assignmentForm.year}`);
        setIsPreviewModalOpen(true);

        try {
            const result = await previewAllTrophyWinners(assignmentForm.season, assignmentForm.year);
            setPreviewData(result);
        } catch (error: any) {
            showError(error.message);
            setPreviewData(null);
        } finally {
            setIsLoadingPreview(false);
        }
    };

    const closePreviewModal = () => {
        setIsPreviewModalOpen(false);
        setPreviewData(null);
        setIsLoadingPreview(false);
    };

    const renderManualTrophyTab = () => (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold">Manual Trophy Assignment</h2>
                <div className="relative">
                    <button
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        <FaPlus />
                        <span>Add Trophy</span>
                    </button>

                    {isDropdownOpen && (
                        <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-neutral-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-10">
                            <div className="p-2">
                                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Select User:</p>
                                {clipteamUsers.map((user) => (
                                    <button
                                        key={user._id}
                                        onClick={() => {
                                            handleOpenModal(user);
                                            setIsDropdownOpen(false);
                                        }}
                                        className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-700 rounded transition-colors"
                                    >
                                        {user.username}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {clipteamUsersWithTrophies.length === 0 ? (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                    <FaTrophy className="mx-auto text-4xl mb-4 opacity-50" />
                    <p>No trophies have been awarded yet.</p>
                </div>
            ) : (
                <div className="grid gap-6">
                    {clipteamUsersWithTrophies.map((user) => (
                        <motion.div
                            key={user._id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white dark:bg-neutral-800 rounded-lg shadow-md p-6"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center space-x-3">
                                    <img
                                        src={user.profilePicture || '/placeholder.png'}
                                        alt={user.username}
                                        className="w-10 h-10 rounded-full"
                                    />
                                    <h3 className="font-semibold text-lg">{user.username}</h3>
                                </div>
                                <button
                                    onClick={() => handleOpenModal(user)}
                                    className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                                >
                                    Add Trophy
                                </button>
                            </div>

                            <div className="space-y-3">
                                {user.profile?.trophies?.map((trophy) => (
                                    <div key={trophy._id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-neutral-700 rounded-lg">
                                        <div className="flex items-center space-x-3">
                                            <FaTrophy className="text-yellow-500" />
                                            <div>
                                                <h4 className="font-medium">{trophy.trophyName}</h4>
                                                <p className="text-sm text-gray-600 dark:text-gray-400">{trophy.description}</p>
                                                <p className="text-xs text-gray-500 dark:text-gray-500">
                                                    Earned: {new Date(trophy.dateEarned).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex space-x-2">
                                            <button
                                                onClick={() => handleOpenModal(user, trophy)}
                                                className="p-2 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900 rounded transition-colors"
                                            >
                                                <FaEdit />
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setTrophyToDelete({ userId: user._id, trophyId: trophy._id });
                                                    setShowDeleteConfirm(true);
                                                }}
                                                className="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900 rounded transition-colors"
                                            >
                                                <FaTrash />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );

    const renderCriteriaTab = () => {
        if (isLoading) {
            return <div className="p-6 text-center">Loading trophy criteria...</div>;
        }

        return (
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-bold">Trophy Criteria Management</h2>
                    <button
                        onClick={() => setIsCriteriaModalOpen(true)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center space-x-2"
                    >
                        <FaPlus />
                        <span>Create New Criteria</span>
                    </button>
                </div>

                {/* Manual Trophy Assignment */}
                <div className="bg-gray-50 dark:bg-neutral-800 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold mb-3">Manual Trophy Assignment</h3>
                    <div className="flex items-center space-x-4">
                        <select
                            value={assignmentForm.season}
                            onChange={(e) => setAssignmentForm({ ...assignmentForm, season: e.target.value })}
                            className="p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-neutral-700"
                        >
                            <option value="">Select Season</option>
                            <option value="Winter">Winter</option>
                            <option value="Spring">Spring</option>
                            <option value="Summer">Summer</option>
                            <option value="Fall">Fall</option>
                        </select>

                        <input
                            type="number"
                            value={assignmentForm.year}
                            onChange={(e) => setAssignmentForm({ ...assignmentForm, year: parseInt(e.target.value) })}
                            className="p-2 border border-gray-300 dark:border-gray-600 rounded-md w-24 bg-white dark:bg-neutral-700"
                            placeholder="Year"
                        />
                        <button
                            onClick={handlePreviewAllTrophies}
                            disabled={!assignmentForm.season || !assignmentForm.year}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
                        >
                            <FaEye />
                            <span>Preview All</span>
                        </button>

                        <button
                            onClick={handleAssignTrophies}
                            disabled={isAssigning}
                            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                        >
                            {isAssigning ? 'Assigning...' : 'Assign Trophies'}
                        </button>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                        This will assign trophies to users based on active criteria for the selected season and year.
                    </p>
                </div>

                {/* Criteria List */}
                <div className="space-y-4">
                    {criteria.length === 0 ? (
                        <p className="text-gray-500 dark:text-gray-400 text-center py-8">No trophy criteria configured yet.</p>
                    ) : (
                        criteria.map((item) => (
                            <div key={item._id} className="bg-white dark:bg-neutral-800 border dark:border-gray-700 rounded-lg p-4">
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <h4 className="font-semibold text-lg">{item.name}</h4>
                                        <p className="text-gray-600 dark:text-gray-400 mb-2">{item.description}</p>                    <div className="flex flex-wrap gap-2 text-sm">
                                            <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
                                                {criteriaTypes.find(ct => ct.value === item.criteriaType)?.label || item.criteriaType}
                                            </span>
                                            {item.criteriaType === 'custom' && item.customCriteria && (
                                                <span className="bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 px-2 py-1 rounded">
                                                    Custom: {item.customCriteria.type}
                                                </span>
                                            )}
                                            {item.awardLimit && item.awardLimit > 1 && (
                                                <span className="bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 px-2 py-1 rounded">
                                                    Max {item.awardLimit} winners
                                                </span>
                                            )}
                                            {item.minValue && item.minValue > 0 && (
                                                <span className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-1 rounded">
                                                    Min: {item.minValue}
                                                </span>
                                            )}
                                            {item.season && (
                                                <span className="bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 px-2 py-1 rounded">
                                                    {item.season}
                                                </span>
                                            )}
                                            {item.year && (
                                                <span className="bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 px-2 py-1 rounded">
                                                    {item.year}
                                                </span>
                                            )}
                                            {item.priority !== undefined && item.priority !== 0 && (
                                                <span className="bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200 px-2 py-1 rounded">
                                                    Priority: {item.priority}
                                                </span>
                                            )}
                                            <span className={`px-2 py-1 rounded ${item.isActive
                                                    ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                                                    : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                                                }`}>
                                                {item.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex space-x-2 ml-4">
                                        <button
                                            onClick={() => handleEditCriteria(item)}
                                            className="px-3 py-1 text-blue-600 dark:text-blue-400 border border-blue-600 dark:border-blue-400 rounded hover:bg-blue-50 dark:hover:bg-blue-900"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleDeleteCriteria(item._id!)}
                                            className="px-3 py-1 text-red-600 dark:text-red-400 border border-red-600 dark:border-red-400 rounded hover:bg-red-50 dark:hover:bg-red-900"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                                <div className="flex justify-end space-x-2 mt-2">
                                    <button
                                        onClick={() => handlePreviewCriteria(item)}
                                        className="px-3 py-1 text-green-600 border border-green-600 rounded hover:bg-green-50 flex items-center space-x-1"
                                    >
                                        <FaEye />
                                        <span>Preview</span>
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-6">
            {/* Alert */}
            {alert && (
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-4 rounded-lg ${alert.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}
                >
                    {alert.message}
                </motion.div>
            )}

            {/* Tab Navigation */}
            <div className="flex space-x-1 bg-gray-100 dark:bg-neutral-800 p-1 rounded-lg">
                <button
                    onClick={() => setActiveTab('manual')}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${activeTab === 'manual'
                            ? 'bg-white dark:bg-neutral-700 text-blue-600 dark:text-blue-400 shadow-sm'
                            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                        }`}
                >
                    <FaUser />
                    <span>Manual Awards</span>
                </button>
                <button
                    onClick={() => setActiveTab('criteria')}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${activeTab === 'criteria'
                            ? 'bg-white dark:bg-neutral-700 text-blue-600 dark:text-blue-400 shadow-sm'
                            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                        }`}
                >
                    <FaCog />
                    <span>Criteria Management</span>
                </button>
            </div>

            {/* Tab Content */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                >
                    {activeTab === 'manual' ? renderManualTrophyTab() : renderCriteriaTab()}
                </motion.div>
            </AnimatePresence>

            {/* Manual Trophy Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
                        onClick={handleCloseModal}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white dark:bg-neutral-800 rounded-lg p-6 w-full max-w-md mx-4"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-bold">
                                    {editMode ? 'Edit Trophy' : 'Add Trophy'}
                                </h2>
                                <button
                                    onClick={handleCloseModal}
                                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                                >
                                    <FaTimes />
                                </button>
                            </div>

                            {selectedUser && (
                                <div className="mb-4 flex items-center space-x-3">
                                    <img
                                        src={selectedUser.profilePicture || '/placeholder.png'}
                                        alt={selectedUser.username}
                                        className="w-8 h-8 rounded-full"
                                    />
                                    <span className="font-medium">{selectedUser.username}</span>
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Trophy Name</label>
                                    <input
                                        type="text"
                                        value={formData.trophyName}
                                        onChange={(e) => setFormData({ ...formData, trophyName: e.target.value })}
                                        className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-neutral-700"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1">Description</label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-neutral-700"
                                        rows={3}
                                        required
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Season</label>
                                        <select
                                            value={formData.season}
                                            onChange={(e) => setFormData({ ...formData, season: e.target.value })}
                                            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-neutral-700"
                                        >
                                            <option value="">Select Season</option>
                                            {seasons.map((season) => (
                                                <option key={season} value={season}>{season}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-1">Year</label>
                                        <select
                                            value={formData.year}
                                            onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                                            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-neutral-700"
                                        >
                                            {years.map((year) => (
                                                <option key={year} value={year}>{year}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="flex justify-end space-x-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={handleCloseModal}
                                        className="px-4 py-2 text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-neutral-700"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center space-x-2"
                                    >
                                        <FaCheck />
                                        <span>{editMode ? 'Update' : 'Add'} Trophy</span>
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Trophy Criteria Modal */}
            <TrophyCriteriaModal
                isOpen={isCriteriaModalOpen}
                onClose={closeCriteriaModal}
                criteria={editingCriteria}
                criteriaTypes={criteriaTypes}
                onSave={loadCriteriaData}
            />

            {/* Delete Confirmation Dialog */}      <ConfirmationDialog
                isOpen={showDeleteConfirm}
                onCancel={() => setShowDeleteConfirm(false)}
                onConfirm={handleDeleteTrophy}
                title="Delete Trophy"
                message="Are you sure you want to delete this trophy? This action cannot be undone."
                confirmText="Delete"
                confirmVariant="danger"
            />

            {/* Trophy Preview Modal */}        <TrophyPreviewModal
                isOpen={isPreviewModalOpen}
                onClose={closePreviewModal}
                title={previewTitle}
                previewData={previewData}
                isLoading={isLoadingPreview}
            />
        </div>
    );
};

export default TrophyManagement;
