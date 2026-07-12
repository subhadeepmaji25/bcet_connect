import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { joiResolver } from "@hookform/resolvers/joi";
import Joi from "joi";
import toast from "react-hot-toast";
import { useUploadResource } from "../../hooks/useResources";
import { useMySubjects } from "../../hooks/useSubjects";
import { Loader2, UploadCloud, Link as LinkIcon, File } from "lucide-react";

const RESOURCE_TYPES = ["document", "video", "link", "video_link", "reference_link", "code_snippet", "presentation"];
const LINK_ONLY_TYPES = ["video_link", "reference_link"];
const VISIBILITY_VALUES = ["public", "department", "semester", "section"];
const DIFFICULTY_VALUES = ["beginner", "intermediate", "advanced"];

// Joi Schema replicating backend zero-drift
const uploadResourceSchema = Joi.object({
  title: Joi.string().trim().min(3).max(150).required().messages({
    "string.empty": "Title is required",
    "string.min": "Title must be at least 3 characters",
  }),
  description: Joi.string().trim().max(1000).allow("").optional(),
  type: Joi.string().valid(...RESOURCE_TYPES).required().messages({
    "any.only": "Invalid resource type",
  }),
  subjectId: Joi.string().required().messages({
    "string.empty": "Subject is required",
  }),
  visibility: Joi.string().valid(...VISIBILITY_VALUES).default("public"),
  section: Joi.string().trim().uppercase().max(5).allow("").optional(),
  externalUrl: Joi.when("type", {
    is: Joi.string().valid(...LINK_ONLY_TYPES),
    then: Joi.string().uri().required().messages({
      "string.uri": "Please enter a valid URL",
      "string.empty": "URL is required for this resource type",
    }),
    otherwise: Joi.any().strip(),
  }),
  tags: Joi.string().allow("").optional(),
  difficulty: Joi.string().valid(...DIFFICULTY_VALUES).default("beginner"),
  estimatedTimeMinutes: Joi.number().integer().min(0).max(1440).allow(null, "").optional(),
  file: Joi.when("type", {
    is: Joi.string().valid(...LINK_ONLY_TYPES),
    then: Joi.any().strip(),
    otherwise: Joi.any().required().messages({
      "any.required": "File is required",
    }),
  }),
});

export const ResourceUploadForm = ({ onSuccess }) => {
  const { data: subjectsData, isLoading: isLoadingSubjects } = useMySubjects();
  const { mutate: uploadResource, isPending } = useUploadResource();
  
  const subjects = subjectsData?.data?.subjects || [];
  const [selectedFile, setSelectedFile] = useState(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: joiResolver(uploadResourceSchema),
    defaultValues: {
      title: "",
      description: "",
      type: "document",
      subjectId: "",
      visibility: "public",
      section: "",
      externalUrl: "",
      tags: "",
      difficulty: "beginner",
      estimatedTimeMinutes: "",
      file: null,
    },
  });

  const selectedType = watch("type");
  const isLinkType = LINK_ONLY_TYPES.includes(selectedType);
  const selectedVisibility = watch("visibility");

  useEffect(() => {
    if (isLinkType) {
      setSelectedFile(null);
      setValue("file", null);
    } else {
      setValue("externalUrl", "");
    }
  }, [isLinkType, setValue]);

  const onSubmit = (data) => {
    const formData = new FormData();
    formData.append("title", data.title);
    if (data.description) formData.append("description", data.description);
    formData.append("type", data.type);
    formData.append("subjectId", data.subjectId);
    if (data.visibility) formData.append("visibility", data.visibility);
    if (data.section) formData.append("section", data.section);
    if (data.difficulty) formData.append("difficulty", data.difficulty);
    if (data.estimatedTimeMinutes) formData.append("estimatedTimeMinutes", data.estimatedTimeMinutes);
    
    if (data.tags) {
      const tagsArray = data.tags.split(",").map(t => t.trim()).filter(Boolean);
      tagsArray.forEach(tag => formData.append("tags[]", tag));
    }

    if (isLinkType) {
      formData.append("externalUrl", data.externalUrl);
    } else {
      if (!selectedFile) {
        toast.error("Please select a file to upload");
        return;
      }
      formData.append("file", selectedFile);
    }

    uploadResource(formData, {
      onSuccess: () => {
        toast.success("Resource uploaded successfully!");
        if (onSuccess) onSuccess();
      },
    });
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setValue("file", e.target.files[0], { shouldValidate: true });
    }
  };

  return (
    <div className="bg-[#1a1a2e] border border-white/10 rounded-xl p-6 shadow-xl">
      <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
        <UploadCloud className="text-indigo-400" />
        Upload Resource
      </h2>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="col-span-1 md:col-span-2">
            <label className="block text-sm font-medium text-slate-300 mb-1">Title *</label>
            <input
              type="text"
              {...register("title")}
              className="w-full bg-[#0f0f1a] border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="e.g. React Fundamentals Part 1"
            />
            {errors.title && <p className="text-red-400 text-sm mt-1">{errors.title.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Subject *</label>
            <select
              {...register("subjectId")}
              className="w-full bg-[#0f0f1a] border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Select a subject...</option>
              {subjects.map(sub => (
                <option key={sub._id} value={sub._id}>{sub.name} ({sub.code})</option>
              ))}
            </select>
            {errors.subjectId && <p className="text-red-400 text-sm mt-1">{errors.subjectId.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Resource Type *</label>
            <select
              {...register("type")}
              className="w-full bg-[#0f0f1a] border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {RESOURCE_TYPES.map(type => (
                <option key={type} value={type}>{type.replace("_", " ").toUpperCase()}</option>
              ))}
            </select>
            {errors.type && <p className="text-red-400 text-sm mt-1">{errors.type.message}</p>}
          </div>
        </div>

        <div className="p-4 bg-[#0f0f1a] rounded-lg border border-indigo-500/30">
          {isLinkType ? (
            <div>
              <label className="block text-sm font-medium text-indigo-300 mb-1 flex items-center gap-1">
                <LinkIcon size={16} /> External URL *
              </label>
              <input
                type="url"
                {...register("externalUrl")}
                className="w-full bg-[#1a1a2e] border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="https://youtube.com/..."
              />
              {errors.externalUrl && <p className="text-red-400 text-sm mt-1">{errors.externalUrl.message}</p>}
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-indigo-300 mb-1 flex items-center gap-1">
                <File size={16} /> Upload File *
              </label>
              <input
                type="file"
                onChange={handleFileChange}
                className="w-full text-slate-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-700 cursor-pointer"
              />
              {errors.file && <p className="text-red-400 text-sm mt-1">{errors.file.message}</p>}
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">Description</label>
          <textarea
            {...register("description")}
            rows={3}
            className="w-full bg-[#0f0f1a] border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="What is this resource about?"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Visibility</label>
            <select
              {...register("visibility")}
              className="w-full bg-[#0f0f1a] border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {VISIBILITY_VALUES.map(v => (
                <option key={v} value={v}>{v.toUpperCase()}</option>
              ))}
            </select>
          </div>

          {selectedVisibility === "section" && (
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Section Code</label>
              <input
                type="text"
                {...register("section")}
                className="w-full bg-[#0f0f1a] border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="e.g. A"
              />
            </div>
          )}
        </div>

        <div className="pt-4 flex justify-end">
          <button
            type="submit"
            disabled={isPending || isLoadingSubjects}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2 px-6 rounded-lg transition-all duration-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Uploading...
              </>
            ) : (
              "Upload Resource"
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
