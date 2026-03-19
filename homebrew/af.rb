class Af < Formula
  desc "AI-First: Generate instant project context for AI coding agents"
  homepage "https://github.com/julianperezpesce/ai-first"
  url "https://registry.npmjs.org/af/-/af-1.2.1.tgz"
  sha256 "TODO: calculate sha256 after first publish"
  license "MIT"
  version "1.2.1"

  depends_on "node@18"

  def install
    system "npm", "install", "-g", "af@#{version}"
  end

  test do
    assert_match "ai-first", shell_output("af --version")
  end
end
