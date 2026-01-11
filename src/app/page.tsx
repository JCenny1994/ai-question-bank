'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { createWorker } from 'tesseract.js';
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';
import { saveAs } from 'file-saver';
import { 
  Upload, 
  Scan, 
  Search, 
  Download, 
  X, 
  FileImage, 
  Loader2,
  Plus,
  Trash2
} from 'lucide-react';

interface Question {
  id: string;
  question: string;
  answer: string;
  imageUrl?: string;
}

export default function Home() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setUploadedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.webp']
    },
    multiple: false
  });

  const handleScan = async () => {
    if (!uploadedImage) return;

    setIsScanning(true);
    setScanProgress(0);

    try {
      const worker = await createWorker('vie+eng', 1, {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            setScanProgress(Math.round(m.progress * 100));
          }
        },
      });

      const { data: { text } } = await worker.recognize(uploadedImage);
      await worker.terminate();

      // Tự động điền vào ô Câu hỏi
      setCurrentQuestion(text.trim());
      setIsScanning(false);
      setScanProgress(0);
    } catch (error) {
      console.error('Lỗi khi quét ảnh:', error);
      setIsScanning(false);
      setScanProgress(0);
    }
  };

  const handleAddQuestion = () => {
    if (currentQuestion.trim() || currentAnswer.trim()) {
      const newQuestion: Question = {
        id: Date.now().toString(),
        question: currentQuestion.trim(),
        answer: currentAnswer.trim(),
        imageUrl: uploadedImage || undefined,
      };
      setQuestions([...questions, newQuestion]);
      setCurrentQuestion('');
      setCurrentAnswer('');
      setUploadedImage(null);
    }
  };

  const handleDeleteQuestion = (id: string) => {
    setQuestions(questions.filter(q => q.id !== id));
  };

  const handleExportWord = async () => {
    if (questions.length === 0) return;

    const doc = new Document({
      sections: [
        {
          children: [
            new Paragraph({
              text: "NGÂN HÀNG ĐỀ THI",
              heading: HeadingLevel.HEADING_1,
            }),
            new Paragraph({
              text: `Tổng số câu hỏi: ${questions.length}`,
              spacing: { after: 400 },
            }),
            ...questions.flatMap((q, index) => [
              new Paragraph({
                text: `Câu ${index + 1}:`,
                heading: HeadingLevel.HEADING_2,
                spacing: { before: 400, after: 200 },
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: q.question || '(Chưa có câu hỏi)',
                    bold: true,
                  }),
                ],
                spacing: { after: 200 },
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: "Đáp án: ",
                    bold: true,
                  }),
                  new TextRun({
                    text: q.answer || '(Chưa có đáp án)',
                  }),
                ],
                spacing: { after: 400 },
              }),
            ]),
          ],
        },
      ],
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, `NganHangDeThi_${new Date().toISOString().split('T')[0]}.docx`);
  };

  const filteredQuestions = questions.filter(q =>
    q.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    q.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-gray-100">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Ngân Hàng Đề Thi
          </h1>
          <p className="text-gray-400">Quản lý và xuất đề thi một cách dễ dàng</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Input Section */}
          <div className="space-y-6">
            {/* Dropzone */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <FileImage className="w-5 h-5 text-blue-400" />
                Khu vực kéo thả ảnh
              </h2>
              
              <div
                {...getRootProps()}
                className={`
                  border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
                  transition-all duration-200
                  ${isDragActive 
                    ? 'border-blue-400 bg-blue-400/10 scale-[1.02]' 
                    : 'border-gray-600 hover:border-gray-500 hover:bg-gray-700/30'
                  }
                `}
              >
                <input {...getInputProps()} />
                {uploadedImage ? (
                  <div className="space-y-4">
                    <div className="relative inline-block">
                      <img
                        src={uploadedImage}
                        alt="Uploaded"
                        className="max-h-64 rounded-lg border border-gray-600"
                      />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setUploadedImage(null);
                        }}
                        className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-sm text-gray-400">Nhấn để thay đổi ảnh</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <Upload className="w-12 h-12 mx-auto text-gray-400" />
                    <div>
                      <p className="text-lg font-medium mb-1">
                        {isDragActive ? 'Thả ảnh vào đây' : 'Kéo thả ảnh vào đây'}
                      </p>
                      <p className="text-sm text-gray-400">hoặc nhấn để chọn file</p>
                      <p className="text-xs text-gray-500 mt-2">
                        PNG, JPG, JPEG, GIF, BMP, WEBP
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Scan Button */}
              <button
                onClick={handleScan}
                disabled={!uploadedImage || isScanning}
                className={`
                  w-full mt-4 py-3 px-4 rounded-lg font-medium
                  flex items-center justify-center gap-2
                  transition-all duration-200
                  ${uploadedImage && !isScanning
                    ? 'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white shadow-lg shadow-blue-500/50'
                    : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                  }
                `}
              >
                {isScanning ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Đang quét... {scanProgress}%</span>
                  </>
                ) : (
                  <>
                    <Scan className="w-5 h-5" />
                    <span>Quét ảnh bằng Tesseract.js</span>
                  </>
                )}
              </button>
            </div>

            {/* Question Input */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 p-6">
              <h2 className="text-xl font-semibold mb-4">Câu hỏi</h2>
              <textarea
                value={currentQuestion}
                onChange={(e) => setCurrentQuestion(e.target.value)}
                placeholder="Nhập câu hỏi hoặc quét từ ảnh..."
                className="w-full h-32 px-4 py-3 bg-gray-900/50 border border-gray-600 rounded-lg 
                         text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 
                         focus:ring-blue-500 focus:border-transparent resize-none"
              />
            </div>

            {/* Answer Input */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 p-6">
              <h2 className="text-xl font-semibold mb-4">Đáp án</h2>
              <textarea
                value={currentAnswer}
                onChange={(e) => setCurrentAnswer(e.target.value)}
                placeholder="Nhập đáp án..."
                className="w-full h-32 px-4 py-3 bg-gray-900/50 border border-gray-600 rounded-lg 
                         text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 
                         focus:ring-purple-500 focus:border-transparent resize-none"
              />
            </div>

            {/* Add Button */}
            <button
              onClick={handleAddQuestion}
              className="w-full py-3 px-4 bg-gradient-to-r from-green-500 to-emerald-500 
                       hover:from-green-600 hover:to-emerald-600 text-white rounded-lg 
                       font-medium flex items-center justify-center gap-2 transition-all 
                       duration-200 shadow-lg shadow-green-500/50"
            >
              <Plus className="w-5 h-5" />
              Thêm câu hỏi vào ngân hàng
            </button>
          </div>

          {/* Right Column - Questions List */}
          <div className="space-y-6">
            {/* Search Bar */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 p-6">
              <div className="flex items-center gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Tìm kiếm câu hỏi hoặc đáp án..."
                    className="w-full pl-10 pr-4 py-3 bg-gray-900/50 border border-gray-600 rounded-lg 
                             text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 
                             focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <button
                  onClick={handleExportWord}
                  disabled={questions.length === 0}
                  className={`
                    px-6 py-3 rounded-lg font-medium flex items-center gap-2
                    transition-all duration-200
                    ${questions.length > 0
                      ? 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white shadow-lg shadow-orange-500/50'
                      : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                    }
                  `}
                >
                  <Download className="w-5 h-5" />
                  Xuất Word
                </button>
              </div>
              <p className="text-sm text-gray-400 mt-3">
                Tìm thấy {filteredQuestions.length} / {questions.length} câu hỏi
              </p>
            </div>

            {/* Questions List */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 p-6">
              <h2 className="text-xl font-semibold mb-4">
                Danh sách câu hỏi ({questions.length})
              </h2>
              
              <div className="space-y-4 max-h-[600px] overflow-y-auto">
                {filteredQuestions.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                    <p className="text-lg mb-2">Chưa có câu hỏi nào</p>
                    <p className="text-sm">Thêm câu hỏi đầu tiên của bạn!</p>
                  </div>
                ) : (
                  filteredQuestions.map((q, index) => (
                    <div
                      key={q.id}
                      className="bg-gray-900/50 rounded-lg border border-gray-700 p-4 hover:border-gray-600 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-sm font-semibold text-blue-400">
                              Câu {questions.findIndex(qq => qq.id === q.id) + 1}
                            </span>
                          </div>
                          {q.imageUrl && (
                            <img
                              src={q.imageUrl}
                              alt="Question"
                              className="max-w-full max-h-32 rounded mb-2 border border-gray-600"
                            />
                          )}
                          <p className="text-gray-200 mb-2 whitespace-pre-wrap">
                            {q.question || <span className="text-gray-500 italic">(Chưa có câu hỏi)</span>}
                          </p>
                          <div className="mt-2 pt-2 border-t border-gray-700">
                            <p className="text-sm text-gray-400">
                              <span className="font-semibold text-purple-400">Đáp án: </span>
                              <span className="text-gray-300">
                                {q.answer || <span className="text-gray-500 italic">(Chưa có đáp án)</span>}
                              </span>
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeleteQuestion(q.id)}
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/10 p-2 rounded transition-colors"
                          title="Xóa câu hỏi"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
